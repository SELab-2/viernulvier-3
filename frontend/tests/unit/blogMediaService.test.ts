import AxiosMockAdapter from "axios-mock-adapter";
import { describe, it, expect, beforeEach, vi } from "vitest";
import axios from "axios";
import * as envModule from "~/shared/utils/env";
import { createApiClient } from "~/shared/services/apiClient";
import {
  getMediaForBlog,
  uploadMediaForBlog,
  deleteMediaForBlog,
} from "~/features/blogs/services/mediaService";
import type {
  MediaItem as MediaResponse,
  MediaList as MediaListResponse,
} from "~/features/archive/types/mediaTypes";
import type { IdPaginationResponse } from "~/features/archive/types/paginationTypes";

describe("blog mediaService", () => {
  let mockAdapter: AxiosMockAdapter;

  const mockMedia1: MediaResponse = {
    id_url: "/api/v1/archive/blogs/1/media/1",
    url: "http://localhost/media/blog1/poster.jpg",
    production_id_url: null,
    blog_id_url: "/api/v1/archive/blogs/1",
    content_type: "image/jpeg",
    uploaded_at: "2026-03-29T14:00:00",
  };

  const mockMedia2: MediaResponse = {
    id_url: "/api/v1/archive/blogs/1/media/2",
    url: "http://localhost/media/blog1/banner.png",
    production_id_url: null,
    blog_id_url: "/api/v1/archive/blogs/1",
    content_type: "image/png",
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

  describe("getMediaForBlog", () => {
    it("returns media list for a blog", async () => {
      const pagination: IdPaginationResponse = {
        has_more: false,
        total_count: 2,
        next_cursor: undefined,
      };
      const mockMediaList: MediaListResponse = {
        media: [mockMedia1, mockMedia2],
        pagination,
      };

      mockAdapter.onGet("/api/v1/archive/blogs/1/media/").reply(200, mockMediaList);

      const result = await getMediaForBlog(1);

      expect(result.media).toHaveLength(2);
      expect(result.pagination.has_more).toBe(false);
    });

    it("returns empty media list when blog has no media", async () => {
      const mockMediaList: MediaListResponse = {
        media: [],
        pagination: { has_more: false, total_count: 0 },
      };

      mockAdapter.onGet("/api/v1/archive/blogs/1/media/").reply(200, mockMediaList);

      const result = await getMediaForBlog(1);

      expect(result.media).toHaveLength(0);
    });

    it("throws when request fails", async () => {
      mockAdapter.onGet("/api/v1/archive/blogs/1/media/").reply(404);

      await expect(getMediaForBlog(1)).rejects.toThrow();
    });
  });

  describe("uploadMediaForBlog", () => {
    it("uploads a file and returns the created media item", async () => {
      mockAdapter.onPost("/api/v1/archive/blogs/1/media/").reply(201, mockMedia1);

      const file = new File(["dummy content"], "poster.jpg", {
        type: "image/jpeg",
      });

      const result = await uploadMediaForBlog(1, file);

      expect(result).toEqual(mockMedia1);
      expect(result.content_type).toBe("image/jpeg");
    });

    it("throws when upload fails", async () => {
      mockAdapter.onPost("/api/v1/archive/blogs/1/media/").reply(415);

      const file = new File(["dummy content"], "doc.pdf", {
        type: "application/pdf",
      });

      await expect(uploadMediaForBlog(1, file)).rejects.toThrow();
    });
  });

  describe("deleteMediaForBlog", () => {
    it("deletes a media item successfully", async () => {
      mockAdapter.onDelete("/api/v1/archive/blogs/1/media/1").reply(204);

      await expect(deleteMediaForBlog(1, 1)).resolves.toBeUndefined();
    });

    it("throws when media item is not found", async () => {
      mockAdapter.onDelete("/api/v1/archive/blogs/1/media/99").reply(404);

      await expect(deleteMediaForBlog(1, 99)).rejects.toThrow();
    });
  });
});
