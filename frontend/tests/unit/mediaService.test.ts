import { describe, it, expect, beforeEach, vi } from "vitest";
import axios from "axios";
import * as envModule from "~/shared/utils/env";
import AxiosMockAdapter from "axios-mock-adapter";
import { createApiClient } from "~/shared/services/apiClient";

import {
  getMediaForProduction,
  uploadMedia,
  deleteMedia,
} from "~/features/archive/services/mediaService";

import type { MediaItem, MediaList } from "~/features/archive/types/mediaTypes";
import type { PaginationResponse } from "~/features/archive/types/paginationTypes";

describe("mediaService", () => {
  let mockAdapter: AxiosMockAdapter;

  const mockMediaItem1: MediaItem = {
    id: 1,
    production_id: 1,
    filename: "poster.jpg",
    content_type: "image/jpeg",
    url: "http://localhost/media/poster.jpg",
    created_at: "2026-03-29T14:00:00",
    updated_at: "2026-03-29T14:00:00",
  };

  const mockMediaItem2: MediaItem = {
    id: 2,
    production_id: 1,
    filename: "banner.png",
    content_type: "image/png",
    url: "http://localhost/media/banner.png",
    created_at: "2026-03-29T14:00:00",
    updated_at: "2026-03-29T14:00:00",
  };

  beforeEach(() => {
    vi.spyOn(envModule, "getEnv").mockReturnValue({
      API_BASE_URL: "http://localhost",
    });

    const apiClient = createApiClient();
    mockAdapter = new AxiosMockAdapter(apiClient);
    vi.spyOn(axios, "create").mockReturnValue(apiClient);
  });

  describe("getMediaForProduction", () => {
    it("returns media list for a production", async () => {
      const pagination: PaginationResponse = { has_more: false };
      const mockMediaList: MediaList = {
        media: [mockMediaItem1, mockMediaItem2],
        pagination,
      };

      mockAdapter
        .onGet("/api/v1/archive/productions/1/media/")
        .reply(200, mockMediaList);

      const result = await getMediaForProduction(1);

      expect(result.media).toHaveLength(2);
      expect(result.pagination.has_more).toBe(false);
    });

    it("returns empty media list when production has no media", async () => {
      const mockMediaList: MediaList = {
        media: [],
        pagination: { has_more: false },
      };

      mockAdapter
        .onGet("/api/v1/archive/productions/1/media/")
        .reply(200, mockMediaList);

      const result = await getMediaForProduction(1);

      expect(result.media).toHaveLength(0);
    });

    it("throws when request fails", async () => {
      mockAdapter.onGet("/api/v1/archive/productions/1/media/").reply(404);

      await expect(getMediaForProduction(1)).rejects.toThrow();
    });
  });

  describe("uploadMedia", () => {
    it("uploads a file and returns the created media item", async () => {
      mockAdapter
        .onPost("/api/v1/archive/productions/1/media/")
        .reply(201, mockMediaItem1);

      const file = new File(["dummy content"], "poster.jpg", {
        type: "image/jpeg",
      });

      const result = await uploadMedia(1, file);

      expect(result).toEqual(mockMediaItem1);
      expect(result.filename).toBe("poster.jpg");
      expect(result.content_type).toBe("image/jpeg");
    });

    it("throws when upload fails", async () => {
      mockAdapter
        .onPost("/api/v1/archive/productions/1/media/")
        .reply(415);

      const file = new File(["dummy content"], "doc.pdf", {
        type: "application/pdf",
      });

      await expect(uploadMedia(1, file)).rejects.toThrow();
    });
  });

  describe("deleteMedia", () => {
    it("deletes a media item successfully", async () => {
      mockAdapter
        .onDelete("/api/v1/archive/productions/1/media/1")
        .reply(204);

      await expect(deleteMedia(1, 1)).resolves.toBeUndefined();
    });

    it("throws when media item is not found", async () => {
      mockAdapter
        .onDelete("/api/v1/archive/productions/1/media/99")
        .reply(404);

      await expect(deleteMedia(1, 99)).rejects.toThrow();
    });
  });
});