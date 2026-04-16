import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import * as envModule from "~/shared/utils/env";
import AxiosMockAdapter from "axios-mock-adapter";
import { createApiClient } from "~/shared/services/apiClient";
import axios from "axios";
import type { Tag } from "~/features/archive/types/tagTypes";
import {
  createTag,
  deleteTag,
  editTag,
  getTagById,
  getAllTags,
} from "~/features/archive/services/tagService";

describe("tagService", () => {
  let mockAdapter: AxiosMockAdapter;

  const mockTag1: Tag = {
    id_url: "http://localhost/api/v1/archive/tags/1",
    names: [
      { language: "nl", name: "tag naam" },
      { language: "en", name: "tag name" },
    ],
  };
  const mockTag2: Tag = {
    id_url: "http://localhost/api/v1/archive/tags/2",
    names: [
      { language: "nl", name: "tag naam2" },
      { language: "en", name: "tag name2" },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(envModule, "getEnv").mockReturnValue({
      API_BASE_URL: "http://localhost",
    });

    // Create a single mocked api client and use this client in all subsequent creations
    const apiClient = createApiClient();
    mockAdapter = new AxiosMockAdapter(apiClient);
    vi.spyOn(axios, "create").mockReturnValue(apiClient);
  });

  afterEach(() => {
    mockAdapter.restore();
    vi.restoreAllMocks();
  });

  describe("getAllTags", () => {
    it("returns a list of tags on success", async () => {
      mockAdapter.onGet("/api/v1/archive/tags").reply(200, [mockTag1, mockTag2]);

      const result = await getAllTags();
      expect(result).toEqual([mockTag1, mockTag2]);
    });
  });

  describe("getTagById", () => {
    it("returns a tag object on success", async () => {
      mockAdapter.onGet("/api/v1/archive/tags/1").reply(200, mockTag1);

      const result = await getTagById(1);
      expect(result).toEqual(mockTag1);
    });
  });

  describe("createTag", () => {
    it("creates a tag object and returns it on success", async () => {
      // Upon calling post, return the request with an added id field
      mockAdapter.onPost("/api/v1/archive/tags").reply((config) => {
        const data = {
          id_url: mockTag1.id_url,
          ...JSON.parse(config.data),
        };
        return [201, data];
      });

      const result = await createTag({ names: mockTag1.names });
      expect(result).toEqual(mockTag1);
    });
  });

  describe("editTag", () => {
    it("edits a tag by id and returns the updated object", async () => {
      mockAdapter.onPatch("/api/v1/archive/tags/1").reply((config) => {
        const data = {
          id_url: "http://localhost/api/v1/archive/tags/1",
          ...JSON.parse(config.data),
        };
        return [201, data];
      });

      const result = await editTag(1, { names: mockTag1.names });
      expect(result).toEqual(mockTag1);
    });
  });

  describe("deleteTag", () => {
    it("deletes a tag", async () => {
      mockAdapter.onDelete("/api/v1/archive/tags/1").reply(204);
      await deleteTag(1);
    });
  });
});
