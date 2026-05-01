import { describe, it, expect, beforeEach, vi } from "vitest";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

import * as envModule from "~/shared/utils/env";
import { createApiClient } from "~/shared/services/apiClient";
import {
  getHistoryEntries,
  createHistoryEntry,
  updateHistoryEntry,
  deleteHistoryEntry,
  type HistoryEntryCreateRequest,
  type HistoryEntryUpdateRequest,
} from "~/features/history/services/historyService";

describe("historyService", () => {
  let mockAdapter: AxiosMockAdapter;

  beforeEach(() => {
    vi.spyOn(envModule, "getEnv").mockReturnValue({
      API_BASE_URL: "http://localhost",
    });

    const apiClient = createApiClient();
    mockAdapter = new AxiosMockAdapter(apiClient);
    vi.spyOn(axios, "create").mockReturnValue(apiClient);
  });

  const MOCK_HISTORY_ENTRY = {
    id_url: "http://localhost/api/v1/archive/history/1",
    year: 2024,
    language: "nl",
    title: "Test Entry",
    content: "This is a test history entry",
  };

  const MOCK_HISTORY_LIST = [
    {
      id_url: "http://localhost/api/v1/archive/history/1",
      year: 2024,
      language: "nl",
      title: "Recent Event",
      content: "A recent event in our history",
    },
    {
      id_url: "http://localhost/api/v1/archive/history/2",
      year: 2020,
      language: "nl",
      title: "Past Event",
      content: "An event from the past",
    },
  ];

  describe("getHistoryEntries", () => {
    it("returns a list of history entries from the API", async () => {
      mockAdapter.onGet("/api/v1/archive/history").reply(200, MOCK_HISTORY_LIST);

      const result = await getHistoryEntries();

      expect(result).toEqual(MOCK_HISTORY_LIST);
      expect(result).toHaveLength(2);
    });

    it("returns an empty list when no entries exist", async () => {
      mockAdapter.onGet("/api/v1/archive/history").reply(200, []);

      const result = await getHistoryEntries();

      expect(result).toEqual([]);
    });

    it("throws when the request fails", async () => {
      mockAdapter.onGet("/api/v1/archive/history").reply(500);

      await expect(getHistoryEntries()).rejects.toThrow();
    });
  });

  describe("createHistoryEntry", () => {
    it("creates a new history entry and returns the result", async () => {
      const request: HistoryEntryCreateRequest = {
        year: 2024,
        language: "nl",
        title: "Test Entry",
        content: "This is a test history entry",
      };

      mockAdapter.onPost("/api/v1/archive/history").reply(201, MOCK_HISTORY_ENTRY);

      const result = await createHistoryEntry(request);

      expect(result).toEqual(MOCK_HISTORY_ENTRY);
      expect(mockAdapter.history.post).toHaveLength(1);
      expect(JSON.parse(mockAdapter.history.post[0].data)).toEqual(request);
    });

    it("rejects when the server returns a validation error", async () => {
      const request: HistoryEntryCreateRequest = {
        year: 2024,
        language: "nl",
        title: "Duplicate",
        content: "Duplicate entry",
      };

      mockAdapter.onPost("/api/v1/archive/history").reply(400, {
        detail: "History entry for year 2024 and language 'nl' already exists",
      });

      await expect(createHistoryEntry(request)).rejects.toMatchObject({
        response: { status: 400 },
      });
    });
  });

  describe("updateHistoryEntry", () => {
    it("updates a history entry and returns the result", async () => {
      const year = 2024;
      const language = "nl";
      const request: HistoryEntryUpdateRequest = {
        title: "Updated Title",
        content: "Updated content",
      };

      const updatedEntry = {
        ...MOCK_HISTORY_ENTRY,
        title: "Updated Title",
        content: "Updated content",
      };

      mockAdapter.onPatch("/api/v1/archive/history/2024/nl").reply(200, updatedEntry);

      const result = await updateHistoryEntry(year, language, request);

      expect(result).toEqual(updatedEntry);
      expect(mockAdapter.history.patch).toHaveLength(1);
      expect(JSON.parse(mockAdapter.history.patch[0].data)).toEqual(request);
    });

    it("builds the history endpoint from year and language", async () => {
      const year = 1999;
      const language = "en";
      const request: HistoryEntryUpdateRequest = {
        title: "Updated",
      };

      mockAdapter.onPatch("/api/v1/archive/history/1999/en").reply(200, MOCK_HISTORY_ENTRY);

      await updateHistoryEntry(year, language, request);

      expect(mockAdapter.history.patch).toHaveLength(1);
      expect(mockAdapter.history.patch[0].url).toBe("/api/v1/archive/history/1999/en");
    });

    it("rejects when the entry does not exist", async () => {
      const year = 999;
      const language = "nl";
      const request: HistoryEntryUpdateRequest = { title: "Updated" };

      mockAdapter.onPatch("/api/v1/archive/history/999/nl").reply(404, {
        detail: "History entry not found",
      });

      await expect(updateHistoryEntry(year, language, request)).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });

  describe("deleteHistoryEntry", () => {
    it("deletes a history entry by id_url", async () => {
      const year = 2024;
      const language = "nl";

      mockAdapter.onDelete("/api/v1/archive/history/2024/nl").reply(204);

      await expect(deleteHistoryEntry(year, language)).resolves.toBeUndefined();
      expect(mockAdapter.history.delete).toHaveLength(1);
    });

    it("builds the delete endpoint from year and language", async () => {
      const year = 1999;
      const language = "en";

      mockAdapter.onDelete("/api/v1/archive/history/1999/en").reply(204);

      await deleteHistoryEntry(year, language);

      expect(mockAdapter.history.delete).toHaveLength(1);
      expect(mockAdapter.history.delete[0].url).toBe("/api/v1/archive/history/1999/en");
    });

    it("rejects when the entry does not exist", async () => {
      const year = 999;
      const language = "nl";

      mockAdapter.onDelete("/api/v1/archive/history/999/nl").reply(404, {
        detail: "History entry not found",
      });

      await expect(deleteHistoryEntry(year, language)).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });
});
