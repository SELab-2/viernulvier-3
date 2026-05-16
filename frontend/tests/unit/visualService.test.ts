import { describe, it, expect, beforeEach, vi } from "vitest";
import axios from "axios";
import * as envModule from "~/shared/utils/env";
import AxiosMockAdapter from "axios-mock-adapter";
import { createApiClient } from "~/shared/services/apiClient";

import {
  getVisuals,
  getVisualById,
  getVisualTypes,
  uploadVisual,
  deleteVisual,
} from "~/features/visuals/services/visualService";

import type { VisualItem, VisualList } from "~/features/visuals/types/visualTypes";
import type { IdPaginationResponse } from "~/features/archive/types/paginationTypes";

describe("visualService", () => {
  let mockAdapter: AxiosMockAdapter;

  const mockVisualItem1: VisualItem = {
    url: "http://localhost/visuals/poster.jpg",
    id_url: "http://localhost/api/v1/archive/visuals/1",
    content_type: "image/jpeg",
    title: "Season Poster",
    description: "Main poster for the 2026 season",
    visual_type: "poster",
    uploaded_at: "2026-03-29T14:00:00",
  };

  const mockVisualItem2: VisualItem = {
    url: "http://localhost/visuals/timetable.pdf",
    id_url: "http://localhost/api/v1/archive/visuals/2",
    content_type: "application/pdf",
    title: "Spring Timetable",
    description: undefined,
    visual_type: "timetable",
    uploaded_at: "2026-03-29T15:00:00",
  };

  beforeEach(() => {
    vi.spyOn(envModule, "getEnv").mockReturnValue({
      API_BASE_URL: "http://localhost",
    });

    const apiClient = createApiClient();
    mockAdapter = new AxiosMockAdapter(apiClient);
    vi.spyOn(axios, "create").mockReturnValue(apiClient);
  });

  describe("getVisuals", () => {
    it("returns a list of visuals", async () => {
      const pagination: IdPaginationResponse = { has_more: false, total_count: 2 };
      const mockVisualList: VisualList = {
        visuals: [mockVisualItem1, mockVisualItem2],
        pagination,
      };

      mockAdapter.onGet("/api/v1/archive/visuals/").reply(200, mockVisualList);

      const result = await getVisuals();

      expect(result.visuals).toHaveLength(2);
      expect(result.pagination.has_more).toBe(false);
    });

    it("returns an empty list when there are no visuals", async () => {
      const mockVisualList: VisualList = {
        visuals: [],
        pagination: { has_more: false, total_count: 0 },
      };

      mockAdapter.onGet("/api/v1/archive/visuals/").reply(200, mockVisualList);

      const result = await getVisuals();

      expect(result.visuals).toHaveLength(0);
    });

    it("passes visual_type filter as query param", async () => {
      const mockVisualList: VisualList = {
        visuals: [mockVisualItem1],
        pagination: { has_more: false, total_count: 1 },
      };

      mockAdapter
        .onGet("/api/v1/archive/visuals/", { params: { visual_type: "poster" } })
        .reply(200, mockVisualList);

      const result = await getVisuals({ visual_type: "poster" });

      expect(result.visuals).toHaveLength(1);
      expect(result.visuals[0].visual_type).toBe("poster");
    });

    it("throws when request fails", async () => {
      mockAdapter.onGet("/api/v1/archive/visuals/").reply(500);

      await expect(getVisuals()).rejects.toThrow();
    });
  });

  describe("getVisualById", () => {
    it("returns a single visual by id", async () => {
      mockAdapter.onGet("/api/v1/archive/visuals/1").reply(200, mockVisualItem1);

      const result = await getVisualById(1);

      expect(result.url).toBe(mockVisualItem1.url);
      expect(result.visual_type).toBe("poster");
    });

    it("throws when visual is not found", async () => {
      mockAdapter.onGet("/api/v1/archive/visuals/99").reply(404);

      await expect(getVisualById(99)).rejects.toThrow();
    });
  });

  describe("getVisualTypes", () => {
    it("returns list of valid visual types from the backend", async () => {
      const types = ["poster", "timetable", "programme", "video", "picture", "other"];

      mockAdapter.onGet("/api/v1/archive/visuals/types").reply(200, types);

      const result = await getVisualTypes();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((t) => expect(typeof t).toBe("string"));
    });

    it("throws when request fails", async () => {
      mockAdapter.onGet("/api/v1/archive/visuals/types").reply(500);

      await expect(getVisualTypes()).rejects.toThrow();
    });
  });

  describe("uploadVisual", () => {
    it("uploads a file and returns the created visual", async () => {
      mockAdapter.onPost("/api/v1/archive/visuals/").reply(201, mockVisualItem1);

      const file = new File(["dummy content"], "poster.jpg", {
        type: "image/jpeg",
      });

      const result = await uploadVisual(file, {
        title: "Season Poster",
        visual_type: "poster",
      });

      expect(result).toEqual(mockVisualItem1);
      expect(result.visual_type).toBe("poster");
    });

    it("uploads a file without optional params", async () => {
      const bareVisual: VisualItem = {
        url: "http://localhost/visuals/unnamed.jpg",
        id_url: "http://localhost/api/v1/archive/visuals/3",
        content_type: "image/jpeg",
        uploaded_at: "2026-03-29T14:00:00",
      };

      mockAdapter.onPost("/api/v1/archive/visuals/").reply(201, bareVisual);

      const file = new File(["dummy content"], "unnamed.jpg", {
        type: "image/jpeg",
      });

      const result = await uploadVisual(file);

      expect(result.title).toBeUndefined();
      expect(result.visual_type).toBeUndefined();
    });

    it("throws when upload fails due to unsupported media type", async () => {
      mockAdapter.onPost("/api/v1/archive/visuals/").reply(415);

      const file = new File(["dummy content"], "doc.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      await expect(uploadVisual(file)).rejects.toThrow();
    });
  });

  describe("deleteVisual", () => {
    it("deletes a visual successfully", async () => {
      mockAdapter.onDelete("/api/v1/archive/visuals/1").reply(204);

      await expect(deleteVisual(1)).resolves.toBeUndefined();
    });

    it("throws when visual is not found", async () => {
      mockAdapter.onDelete("/api/v1/archive/visuals/99").reply(404);

      await expect(deleteVisual(99)).rejects.toThrow();
    });
  });
});
