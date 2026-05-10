import { screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderWithRouterAndTheme } from "tests/utils/renderWithRouterAndTheme";
import userEvent from "@testing-library/user-event";
import * as blogService from "~/features/blogs/services/blogService";
import type { Blog } from "~/features/blogs/types/blogTypes";

vi.mock("~/features/blogs/services/blogService");

export const mockBlogs: Blog[] = [
  {
    id_url: "/blogs/1",
    production_id_urls: [],
    blog_contents: [
      {
        language: "en",
        title: "First Blog Post",
        content: "<p>Hello world</p>",
        blog_id_url: "/blogs/1",
      },
    ],
  },
  {
    id_url: "/blogs/2",
    production_id_urls: [],
    blog_contents: [
      {
        language: "en",
        title: "Second Blog Post",
        content: "<p>Another post</p>",
        blog_id_url: "/blogs/2",
      },
    ],
  },
  {
    id_url: "/blogs/3",
    production_id_urls: [],
    blog_contents: [
      {
        language: "en",
        title: "Third Blog Post",
        content: "<p>Yet another</p>",
        blog_id_url: "/blogs/3",
      },
    ],
  },
];

async function renderBlogPage() {
  renderWithRouterAndTheme({ useRealBlogs: true });
  const user = userEvent.setup();
  const links = screen.getAllByRole("link", { name: "I18N_Blogs" });
  await user.click(links[0]);
}

function mockFetchedBlogs(blogs: Blog[], hasMore = false, nextCursor?: string) {
  vi.mocked(blogService.getBlogsPaginated).mockResolvedValue({
    blogs,
    pagination: {
      has_more: hasMore,
      total_count: blogs.length,
      ...(nextCursor ? { next_cursor: nextCursor } : {}),
    },
  });
}

function expectEveryBlogVisible(blogs: Blog[]) {
  for (const blog of blogs) {
    const exists = blog.blog_contents.some(
      (content) => content.title && screen.queryByText(content.title)
    );
    expect(exists).toBe(true);
  }
}

describe("BlogPage", () => {
  beforeEach(() => {
    mockFetchedBlogs(mockBlogs);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders title", async () => {
    await renderBlogPage();
    expect(screen.getByText("I18N_Blogs_Title")).toBeInTheDocument();
  });

  it("renders search bar", async () => {
    await renderBlogPage();
    expect(
      screen.getByPlaceholderText("I18N_Blogs_Search_Placeholder")
    ).toBeInTheDocument();
  });

  it("renders a fetched list of blogs", async () => {
    mockFetchedBlogs(mockBlogs);
    await renderBlogPage();

    expectEveryBlogVisible(mockBlogs);
  });

  describe("Show More", () => {
    it("shows a button when there is more data", async () => {
      mockFetchedBlogs([mockBlogs[0]], true, "test_cursor");
      await renderBlogPage();

      expect(screen.getByText("I18N_Blogs_Show_More")).toBeInTheDocument();
    });

    it("does not show a button when there is no more data", async () => {
      mockFetchedBlogs(mockBlogs, false);
      await renderBlogPage();

      expect(screen.queryByText("I18N_Blogs_Show_More")).toBeNull();
    });

    it("loads more blogs when clicking show more", async () => {
      const user = userEvent.setup();
      vi.mocked(blogService.getBlogsPaginated)
        .mockResolvedValueOnce({
          blogs: [mockBlogs[0]],
          pagination: { has_more: true, next_cursor: "test_cursor", total_count: 2 },
        })
        .mockResolvedValueOnce({
          blogs: mockBlogs.slice(1),
          pagination: { has_more: false, total_count: 2 },
        });
      await renderBlogPage();

      // Before clicking show more
      expectEveryBlogVisible([mockBlogs[0]]);

      expect(blogService.getBlogsPaginated).toHaveBeenNthCalledWith(1, {
        blog_name: undefined,
        sort_order: "Descending",
      });

      await user.click(screen.getByText("I18N_Blogs_Show_More"));

      // After clicking show more
      expectEveryBlogVisible(mockBlogs.slice(1));

      expect(blogService.getBlogsPaginated).toHaveBeenCalledWith({
        cursor: "test_cursor",
        blog_name: undefined,
        sort_order: "Descending",
      });
    });
  });

  describe("Search", () => {
    it("re-fetches with title filter when typing in search bar", async () => {
      const user = userEvent.setup();
      mockFetchedBlogs(mockBlogs);
      await renderBlogPage();

      const searchInput = screen.getByPlaceholderText("I18N_Blogs_Search_Placeholder");
      await user.type(searchInput, "my blog");

      await vi.waitFor(() => {
        expect(blogService.getBlogsPaginated).toHaveBeenCalledWith(
          expect.objectContaining({ blog_name: "my blog" })
        );
      });
    });

    it("shows no results text when search returns 0 blogs", async () => {
      const user = userEvent.setup();
      vi.mocked(blogService.getBlogsPaginated).mockResolvedValue({
        blogs: [],
        pagination: { has_more: false, total_count: 0 },
      });
      await renderBlogPage();

      const searchInput = screen.getByPlaceholderText("I18N_Blogs_Search_Placeholder");
      await user.type(searchInput, "nothing");

      await vi.waitFor(() => {
        expect(screen.getByText("I18N_Blogs_No_Results_Header")).toBeInTheDocument();
        expect(screen.getByText("I18N_Blogs_No_Results_Subtext")).toBeInTheDocument();
      });
    });
  });
});
