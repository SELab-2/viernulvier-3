import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Blog, BlogContent } from "~/features/blogs/types/blogTypes";
import { BlogCard, BlogCardList } from "~/features/blogs/components/BlogCard";
import type { Production } from "~/features/archive/types/productionTypes";
import { MemoryRouter } from "react-router";
import type { ProductionGroup } from "~/features/archive/types/productionGroupTypes";
import {
  getProductionGroupByUrl,
  getProductionsForGroup,
} from "~/features/archive/services/productionGroupService";

vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-i18next")>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  };
});

vi.mock("~/features/archive/services/productionGroupService", () => ({
  getProductionGroupByUrl: vi.fn(),
  getProductionsForGroup: vi.fn(),
}));

vi.mock("~/features/blogs/services/mediaService", () => ({
  getMediaForBlog: vi
    .fn()
    .mockResolvedValue({ media: [], pagination: { has_more: false, total_count: 0 } }),
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
  series_id_url: "/api/v1/archive/series/1",
  blog_contents: [mockBlogContentEN, mockBlogContentNL],
};

const mockBlogNoProductions: Blog = {
  id_url: "/api/v1/archive/blogs/2",
  series_id_url: "/api/v1/archive/series/2",
  blog_contents: [mockBlogContentEN],
};

const mockBlogMultipleProductions: Blog = {
  id_url: "/api/v1/archive/blogs/3",
  series_id_url: "/api/v1/archive/series/3",
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

function makeProduction(index: number): Production {
  return {
    ...mockProductionEN,
    id_url: `/api/v1/archive/productions/${index}`,
    production_infos: mockProductionEN.production_infos.map((info) => ({
      ...info,
      production_id_url: `/api/v1/archive/productions/${index}`,
    })),
  };
}

const baseProdGroup: ProductionGroup = {
  id_url: "http://localhost/api/v1/archive/series/1",
  title: "foo",
  is_public_filter: true,
  production_id_urls: [],
};

function renderBlogCard(props: Partial<Parameters<typeof BlogCard>[0]> = {}) {
  return render(
    <MemoryRouter>
      <BlogCard blog={mockBlog} preferredLanguage="en" {...props} />
    </MemoryRouter>
  );
}

describe("BlogCard", () => {
  beforeEach(() => {
    vi.mocked(getProductionGroupByUrl).mockResolvedValue(baseProdGroup);
    vi.mocked(getProductionsForGroup).mockResolvedValue([]);
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

  it("renders blog without content", () => {
    const emptyBlog: Blog = {
      ...mockBlog,
      blog_contents: [],
    };

    renderBlogCard({ blog: emptyBlog });
    expect(screen.getByText("blogs.card.noContentFound")).toBeInTheDocument();
  });

  it("renders the no-production fallback text", () => {
    renderBlogCard({ blog: mockBlogNoProductions });
    expect(screen.getByText("blogs.card.no_prods")).toBeInTheDocument();
  });

  it("renders the production chip with the correct label for 1 production", async () => {
    vi.mocked(getProductionsForGroup).mockResolvedValue([mockProductionEN]);
    renderBlogCard({ blog: mockBlog });
    await waitFor(() =>
      expect(screen.getByText("Production Title EN")).toBeInTheDocument()
    );
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it("renders a chip showing the first production title + overflow count", async () => {
    vi.mocked(getProductionsForGroup).mockResolvedValue([
      makeProduction(1),
      makeProduction(2),
      makeProduction(3),
    ]);

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
      vi.mocked(getProductionsForGroup).mockResolvedValue(
        Array.from({ length: count }, (_, i) => makeProduction(i + 1))
      );

      const blog: Blog = {
        ...mockBlog,
        blog_contents: [mockBlogContentEN],
        series_id_url: "/api/v1/archive/series/1",
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
    vi.mocked(getProductionsForGroup).mockResolvedValue([mockProductionEN]);
  });

  it("renders a card for every blog in the list", () => {
    const blog2: Blog = {
      id_url: "/api/v1/archive/blogs/2",
      series_id_url: "/api/v1/archive/series/2",
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
      <MemoryRouter>
        <BlogCardList blogs={[mockBlog, blog2]} prefferedLanguage="en" />
      </MemoryRouter>
    );

    expect(screen.getByText("A Blog Post Title")).toBeInTheDocument();
    expect(screen.getByText("Second Blog")).toBeInTheDocument();
  });

  it("renders nothing (empty list) when blogs array is empty", () => {
    const { container } = render(<BlogCardList blogs={[]} prefferedLanguage="en" />);
    expect(container.firstChild?.childNodes).toHaveLength(0);
  });
});
