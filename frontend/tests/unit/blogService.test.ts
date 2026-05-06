import AxiosMockAdapter from "axios-mock-adapter";
import { describe, it, expect, beforeEach, vi } from "vitest";
import * as envModule from "~/shared/utils/env";
import type {
  BlogContent,
  Blog,
  BlogList,
  BlogCreate,
  BlogUpdate,
} from "~/features/blogs/types/blogTypes";
import { createApiClient } from "~/shared/services/apiClient";
import axios from "axios";
import type { JsonPaginationResponse } from "~/features/archive/types/paginationTypes";
import {
  createBlog,
  deleteBlog,
  getBlog,
  getBlogByUrl,
  getBlogsPaginated,
  updateBlog,
  updateBlogByUrl,
} from "~/features/blogs/services/blogService";

describe("blogService", () => {
  let mockAdapter: AxiosMockAdapter;

  const mockBlogContent1EN: BlogContent = {
    blog_id_url: "/api/v1/archive/blogs/1",
    language: "en",
    title: "title1",
    content: "content1",
  };

  const mockBlogContent2EN: BlogContent = {
    blog_id_url: "/api/v1/archive/blogs/2",
    language: "en",
    title: "title2",
    content: "content2",
  };

  const mockBlogContent2NL: BlogContent = {
    blog_id_url: "/api/v1/archive/blogs/2",
    language: "en",
    title: "titel2",
    content: "inhoud2",
  };

  const mockBlog1: Blog = {
    id_url: "/api/v1/archive/blogs/1",
    production_id_urls: ["/api/v1/archive/productions/1"],
    blog_contents: [mockBlogContent1EN],
  };

  const mockBlog2: Blog = {
    id_url: "/api/v1/archive/blogs/2",
    production_id_urls: [
      "/api/v1/archive/productions/1",
      "/api/v1/archive/productions/2",
    ],
    blog_contents: [mockBlogContent2EN, mockBlogContent2NL],
  };

  beforeEach(() => {
    vi.spyOn(envModule, "getEnv").mockReturnValue({
      API_BASE_URL: "http://localhost",
    });

    const apiClient = createApiClient();
    mockAdapter = new AxiosMockAdapter(apiClient);
    mockAdapter.onGet("/api/v1/archive/blogs/1").reply(200, mockBlog1);
    mockAdapter.onGet("/api/v1/archive/blogs/2").reply(200, mockBlog2);
    vi.spyOn(axios, "create").mockReturnValue(apiClient);
  });

  describe("getBlogs", () => {
    it("returns blogs list", async () => {
      const pagination: JsonPaginationResponse = {
        has_more: false,
        total_count: 2,
      };

      const mockBlogList: BlogList = {
        blogs: [mockBlog1, mockBlog2],
        pagination: pagination,
      };

      mockAdapter.onGet("/api/v1/archive/blogs").reply(200, mockBlogList);
      const result = await getBlogsPaginated();

      expect(result.blogs).toHaveLength(2);
      expect(result.pagination.has_more).toBe(false);
    });
  });

  describe("getBlog", () => {
    it("returns a single blog by id on success", async () => {
      const result = await getBlog(1);

      expect(result).toBeDefined();

      expect(result.id_url).toBe(mockBlog1.id_url);
      expect(result.production_id_urls).toEqual(mockBlog1.production_id_urls);

      expect(result.blog_contents).toHaveLength(1);
      expect(result.blog_contents).toEqual(
        expect.arrayContaining([expect.objectContaining({ language: "en" })])
      );
    });

    it("returns a single blog by url on success", async () => {
      const result = await getBlogByUrl("/api/v1/archive/blogs/1");

      expect(result).toBeDefined();

      expect(result.id_url).toBe(mockBlog1.id_url);
      expect(result.production_id_urls).toEqual(mockBlog1.production_id_urls);

      expect(result.blog_contents).toHaveLength(1);
      expect(result.blog_contents).toEqual(
        expect.arrayContaining([expect.objectContaining({ language: "en" })])
      );
    });
  });

  describe("createBlog", () => {
    it("creates a new blog and returns it", async () => {
      const blog_content: BlogContent = {
        blog_id_url: "/api/v1/archive/blogs/3",
        language: "en",
        title: "title3",
        content: "content3",
      };
      const blogData: BlogCreate = {
        blog_content: blog_content,
        production_id_urls: [],
      };

      const mockResponse: Blog = {
        id_url: "/api/v1/archive/blogs/3",
        blog_contents: [blog_content],
        production_id_urls: [],
      };

      mockAdapter.onPost("/api/v1/archive/blogs").reply(201, mockResponse);
      const result = await createBlog(blogData);
      expect(result).toEqual(mockResponse);
      expect(result.id_url).toBe("/api/v1/archive/blogs/3");
    });

    it("throws when create request fails", async () => {
      const blog_content: BlogContent = {
        blog_id_url: "/api/v1/archive/blogs/3",
        language: "en",
        title: "title3",
        content: "content3",
      };
      const blogData: BlogCreate = {
        blog_content: blog_content,
        production_id_urls: [],
      };

      mockAdapter.onPost("/api/v1/archive/blogs").reply(400);

      await expect(createBlog(blogData)).rejects.toThrow();
    });
  });
  describe("updateBlog", () => {
    it("updates a blog and returns updated data", async () => {
      const blogUpdate: BlogUpdate = {
        blog_contents: [mockBlogContent2EN, mockBlogContent2NL],
        production_id_urls: ["/api/v1/archive/productions/3"],
      };

      const mockBlog2_updated: Blog = {
        id_url: "/api/v1/archive/blogs/2",
        blog_contents: [mockBlogContent2EN, mockBlogContent2NL],
        production_id_urls: ["/api/v1/archive/productions/3"],
      };

      mockAdapter.onPatch("/api/v1/archive/blogs/2").reply(200, mockBlog2_updated);

      const result = await updateBlog(2, blogUpdate);

      expect(result).toEqual(mockBlog2_updated);
    });

    it("updates a blog and returns updated data by url", async () => {
      const blogUpdate: BlogUpdate = {
        blog_contents: [mockBlogContent2EN, mockBlogContent2NL],
        production_id_urls: ["/api/v1/archive/productions/3"],
      };

      const mockBlog2_updated: Blog = {
        id_url: "/api/v1/archive/blogs/2",
        blog_contents: [mockBlogContent2EN, mockBlogContent2NL],
        production_id_urls: ["/api/v1/archive/productions/3"],
      };

      mockAdapter.onPatch("/api/v1/archive/blogs/2").reply(200, mockBlog2_updated);

      const result = await updateBlogByUrl("/api/v1/archive/blogs/2", blogUpdate);

      expect(result).toEqual(mockBlog2_updated);
    });

    it("throws when update request fails", async () => {
      const blogUpdate: BlogUpdate = {
        blog_contents: [],
        production_id_urls: [],
      };

      mockAdapter.onPatch("/api/v1/archive/blogs/2").reply(400);
      await expect(updateBlog(1, blogUpdate)).rejects.toThrow();
    });
  });
  describe("deleteBlog", () => {
    it("deletes a blog successfully", async () => {
      mockAdapter.onDelete("/api/v1/archive/blogs/1").reply(204);

      await expect(deleteBlog(1)).resolves.toBeUndefined();
    });

    it("throws when delete request fails", async () => {
      mockAdapter.onDelete("/api/v1/archive/blogs/1").reply(404);

      await expect(deleteBlog(1)).rejects.toThrow();
    });
  });
});
