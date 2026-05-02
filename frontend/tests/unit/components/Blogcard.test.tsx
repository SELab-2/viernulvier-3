import { render, screen } from "@testing-library/react";
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

async function renderBlogCard(props: Partial<Parameters<typeof BlogCard>[0]> = {}) {
  const element = await BlogCard({ blog: mockBlog, ...props });
  return render(element);
}

describe("BlogCard", () => {
  beforeEach(() => {
    vi.mocked(productionService.getProductionByUrl).mockResolvedValue(mockProductionEN);
  });

  it("renders the given title", async () => {
    await renderBlogCard();
    expect(screen.getByText("Production Title EN")).toBeInTheDocument();
  });

  it("renders a long title without throwing", async () => {
    const longTitle = "A".repeat(300);
    const blog: Blog = {
      ...mockBlog,
      blog_contents: [{ ...mockBlogContentEN, title: longTitle }],
    };
    await expect(renderBlogCard({ blog })).resolves.not.toThrow();
    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });

  it("renders the beginning of the content text", async () => {
    await renderBlogCard({ preferredLanguage: "en" });
    expect(
      screen.getByText(/^Some interesting content about the blog topic\./)
    ).toBeInTheDocument();
  });

  it("renders content with newlines", async () => {
    const multilineContent = "First line.\nSecond line.\nThird line.";
    const blog: Blog = {
      ...mockBlog,
      blog_contents: [{ ...mockBlogContentEN, content: multilineContent }],
    };
    await expect(renderBlogCard({ blog })).resolves.not.toThrow();
    expect(screen.getByText(/First line\./)).toBeInTheDocument();
  });

  it("renders the no-production fallback text", async () => {
    await renderBlogCard({ blog: mockBlogNoProductions });
    expect(screen.getByText("blogs.card.no_prods")).toBeInTheDocument();
  });

  it("renders the production chip with the correct label for 1 production", async () => {
    await renderBlogCard({ blog: mockBlog });
    expect(screen.getByText("Production Title EN")).toBeInTheDocument();
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it("renders a chip showing the first production title + overflow count", async () => {
    vi.mocked(productionService.getProductionByUrl).mockResolvedValue(mockProductionEN);

    await renderBlogCard({ blog: mockBlogMultipleProductions });

    expect(screen.getByText("Production Title EN")).toBeInTheDocument();
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

      await renderBlogCard({ blog });

      expect(screen.getByText(new RegExp(`^\\${expected}`))).toBeInTheDocument();
    }
  );

  it("renders the 'details' link", async () => {
    await renderBlogCard();
    expect(screen.getByText("blogs.card.details")).toBeInTheDocument();
  });
});

describe("BlogCardList", () => {
  beforeEach(() => {
    vi.mocked(productionService.getProductionByUrl).mockResolvedValue(mockProductionEN);
  });

  it("renders a card for every blog in the list", async () => {
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

    const cards = await Promise.all(
      [mockBlog, blog2].map((blog) => BlogCard({ blog }))
    );

    render(
      <div>
        {cards.map((card, i) => (
          <div key={i}>{card}</div>
        ))}
      </div>
    );

    expect(screen.getByText("A Blog Post Title")).toBeInTheDocument();
    expect(screen.getByText("Second Blog")).toBeInTheDocument();
  });

  it("renders nothing (empty list) when blogs array is empty", () => {
    const { container } = render(<BlogCardList blogs={[]} />);
    expect(container.firstChild?.childNodes).toHaveLength(0);
  });
});
