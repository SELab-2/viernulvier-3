import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Blog, BlogContent } from "~/features/blogs/types/blogTypes";
import { BlogCard, BlogCardList } from "~/features/blogs/components/BlogCard";
import * as productionService from "~/features/archive/services/productionService";
import type { Production } from "~/features/archive/types/productionTypes";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("~/features/archive/services/productionService", () => ({
  getProductionByUrl: vi.fn(),
}));

const mockBlogContentEN: BlogContent = {
  blog_id_url: "/api/v1/archive/blogs/1",
  language: "en",
  title: "A Blog Post Title",
  content: "Some interesting content about the blog topic.",
};

const mockBlogContentNL: BlogContent = {
  blog_id_url: "/api/v1/archive/blogs/1",
  language: "nl",
  title: "Een Blog Titel",
  content: "Wat interessante inhoud over het blogonderwerp.",
};

const mockBlog: Blog = {
  id_url: "/api/v1/archive/blogs/1",
  production_id_urls: ["/api/v1/archive/productions/1"],
  blog_contents: [mockBlogContentEN, mockBlogContentNL],
};

const mockBlogNoProductions: Blog = {
  id_url: "/api/v1/archive/blogs/2",
  production_id_urls: [],
  blog_contents: [mockBlogContentEN],
};

const mockBlogMultipleProductions: Blog = {
  id_url: "/api/v1/archive/blogs/3",
  production_id_urls: [
    "/api/v1/archive/productions/1",
    "/api/v1/archive/productions/2",
    "/api/v1/archive/productions/3",
  ],
  blog_contents: [mockBlogContentEN],
};

const mockProductionEN: Production = {
  production_infos: [
    {
      language: "en",
      title: "Production Title EN",
      production_id_url: "",
    },
    {
      language: "nl",
      title: "Productie Titel NL",
      production_id_url: "",
    },
  ],
  id_url: "",
  event_id_urls: [],
  tags: [],
};

function renderBlogCard(props: Partial<Parameters<typeof BlogCard>[0]> = {}) {
  return render(<BlogCard blog={mockBlog} preferredLanguage="en" {...props} />);
}

describe("BlogCard", () => {
  beforeEach(() => {
    vi.mocked(productionService.getProductionByUrl).mockResolvedValue(mockProductionEN);
  });

  it("renders the given title", () => {
    renderBlogCard();
    expect(screen.getByText("A Blog Post Title")).toBeInTheDocument();
  });

  it("renders a long title without throwing", () => {
    const longTitle = "A".repeat(300);
    const blog: Blog = {
      ...mockBlog,
      blog_contents: [{ ...mockBlogContentEN, title: longTitle }],
    };
    renderBlogCard({ blog });
    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });

  it("renders the beginning of the content text", () => {
    renderBlogCard({ preferredLanguage: "en" });
    expect(
      screen.getByText(/^Some interesting content about the blog topic\./)
    ).toBeInTheDocument();
  });

  it("renders content with newlines", () => {
    const multilineContent = "First line.\nSecond line.\nThird line.";
    const blog: Blog = {
      ...mockBlog,
      blog_contents: [{ ...mockBlogContentEN, content: multilineContent }],
    };
    renderBlogCard({ blog });
    expect(screen.getByText(/First line\./)).toBeInTheDocument();
  });

  it("renders content as html", () => {
    const htmlContent = "<p>First paragraph.</p><p>Second paragraph.</p>";
    const blog: Blog = {
      ...mockBlog,
      blog_contents: [{ ...mockBlogContentEN, content: htmlContent }],
    };
    const { container } = renderBlogCard({ blog });
    const blogCardTexts = container.querySelectorAll(".blog-card-text");
    const blogCardText = blogCardTexts[1];
    expect(blogCardText?.innerHTML).toBe(htmlContent);
    expect(blogCardText?.querySelectorAll("p")).toHaveLength(2);
  });

  it("renders the no-production fallback text", () => {
    renderBlogCard({ blog: mockBlogNoProductions });
    expect(screen.getByText("blogs.card.no_prods")).toBeInTheDocument();
  });

  it("renders the production chip with the correct label for 1 production", async () => {
    renderBlogCard({ blog: mockBlog });
    await waitFor(() =>
      expect(screen.getByText("Production Title EN")).toBeInTheDocument()
    );
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it("renders a chip showing the first production title + overflow count", async () => {
    vi.mocked(productionService.getProductionByUrl).mockResolvedValue(mockProductionEN);

    renderBlogCard({ blog: mockBlogMultipleProductions });

    await waitFor(() =>
      expect(screen.getByText("Production Title EN")).toBeInTheDocument()
    );
    expect(screen.getByText(/^\+2/)).toBeInTheDocument();
  });

  it.each([
    { count: 2, expected: "+1" },
    { count: 3, expected: "+2" },
    { count: 5, expected: "+4" },
  ])(
    "overflow count shows $expected for $count productions",
    async ({ count, expected }) => {
      const blog: Blog = {
        ...mockBlog,
        blog_contents: [mockBlogContentEN],
        production_id_urls: Array.from(
          { length: count },
          (_, i) => `/api/v1/archive/productions/${i + 1}`
        ),
      };

      renderBlogCard({ blog });

      await waitFor(() =>
        expect(screen.getByText(new RegExp(`^\\${expected}`))).toBeInTheDocument()
      );
    }
  );

  it("renders the 'details' link", () => {
    renderBlogCard();
    expect(screen.getByText("blogs.card.details")).toBeInTheDocument();
  });
});

describe("BlogCardList", () => {
  beforeEach(() => {
    vi.mocked(productionService.getProductionByUrl).mockResolvedValue(mockProductionEN);
  });

  it("renders a card for every blog in the list", () => {
    const blog2: Blog = {
      id_url: "/api/v1/archive/blogs/2",
      production_id_urls: [],
      blog_contents: [
        {
          blog_id_url: "/api/v1/archive/blogs/2",
          language: "en",
          title: "Second Blog",
          content: "Second content",
        },
      ],
    };

    render(
      <div>
        {[mockBlog, blog2].map((blog) => (
          <BlogCard key={blog.id_url} blog={blog} preferredLanguage="en" />
        ))}
      </div>
    );

    expect(screen.getByText("A Blog Post Title")).toBeInTheDocument();
    expect(screen.getByText("Second Blog")).toBeInTheDocument();
  });

  it("renders nothing (empty list) when blogs array is empty", () => {
    const { container } = render(<BlogCardList blogs={[]} prefferedLanguage="en" />);
    expect(container.firstChild?.childNodes).toHaveLength(0);
  });
});
