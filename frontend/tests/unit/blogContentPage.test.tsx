import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getProductionByUrl } from "~/features/archive/services/productionService";
import { BlogContentPage } from "~/features/blogs/pages/BlogContentPage";
import type { Blog } from "~/features/blogs/types/blogTypes";
import type { Production } from "~/features/archive/types/productionTypes";

vi.mock("~/features/archive/services/productionService", () => ({
  getProductionByUrl: vi.fn(),
}));

vi.mock("~/features/blogs/components/BlogPageMediaGallery", () => ({
  BlogPageMediaGallery: ({ title }: { title: string }) => (
    <div data-testid="blog-media-gallery">Mock gallery for {title}</div>
  ),
}));

vi.mock("dompurify", () => ({
  default: {
    sanitize: (html: string) => html,
  },
}));

function renderPage(blog: Blog, preferredLanguage: string = "nl") {
  const router = createMemoryRouter(
    [
      {
        path: "/:lang/blogs/:blogId",
        element: <BlogContentPage blog={blog} preferredLanguage={preferredLanguage} />,
      },
    ],
    {
      initialEntries: [`/${preferredLanguage}/blogs/1`],
    }
  );

  return render(<RouterProvider router={router} />);
}

const baseBlog: Blog = {
  id_url: "http://localhost/api/v1/blogs/1",
  production_id_urls: [],
  blog_contents: [
    {
      language: "nl",
      title: "Nederlandse Blog Titel",
      content: "<p>Nederlandse inhoud</p>",
      blog_id_url: "http://localhost/api/v1/blogs/1",
    },
    {
      language: "en",
      title: "English Blog Title",
      content: "<p>English content</p>",
      blog_id_url: "http://localhost/api/v1/blogs/1",
    },
  ],
};

const baseBlogOneLanguage: Blog = {
  id_url: "http://localhost/api/v1/blogs/1",
  production_id_urls: [],
  blog_contents: [
    {
      language: "nl",
      title: "Nederlandse Blog Titel",
      content: "<p>Nederlandse inhoud</p>",
      blog_id_url: "http://localhost/api/v1/blogs/1",
    },
  ],
};

const baseBlogEmptyContent: Blog = {
  id_url: "http://localhost/api/v1/blogs/1",
  production_id_urls: [],
  blog_contents: [
    {
      language: "nl",
      title: "Blog Zonder Inhoud",
      content: "",
      blog_id_url: "http://localhost/api/v1/blogs/1",
    },
  ],
};

const baseBlogWithImages: Blog = {
  id_url: "http://localhost/api/v1/blogs/1",
  production_id_urls: [],
  blog_contents: [
    {
      language: "nl",
      title: "Blog Met Afbeeldingen",
      content: '<p>Tekst</p><img src="foto.jpg" alt="foto" /><p>Meer tekst</p>',
      blog_id_url: "http://localhost/api/v1/blogs/1",
    },
  ],
};

describe("BlogContentPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders title and content for the active language", async () => {
    renderPage(baseBlog, "en");

    expect(
      screen.getByRole("heading", { name: "English Blog Title" })
    ).toBeInTheDocument();
    expect(screen.getByText("English content")).toBeInTheDocument();
    expect(await screen.findByTestId("blog-media-gallery")).toHaveTextContent(
      "Mock gallery for English Blog Title"
    );
  });

  it("renders the correct language when preferredLanguage is nl", async () => {
    renderPage(baseBlog, "nl");

    expect(
      screen.getByRole("heading", { name: "Nederlandse Blog Titel" })
    ).toBeInTheDocument();
    expect(screen.getByText("Nederlandse inhoud")).toBeInTheDocument();
  });

  it("shows fallback title when no content exists for the requested language", async () => {
    renderPage(baseBlogOneLanguage, "en");

    expect(
      screen.getByRole("heading", { name: "I18N_Blog_Fallback" })
    ).toBeInTheDocument();

    const blogBody = document.getElementById("blog-body");
    expect(blogBody).not.toBeNull();
    expect(blogBody).toHaveTextContent("I18N_Blog_Fallback");
  });

  it("shows fallback message when blog content is empty", async () => {
    renderPage(baseBlogEmptyContent, "nl");

    expect(
      screen.getByRole("heading", { name: "Blog Zonder Inhoud" })
    ).toBeInTheDocument();
    expect(screen.getByText("I18N_Blog_Fallback")).toBeInTheDocument();
  });

  it("strips images from rendered blog content", () => {
    renderPage(baseBlogWithImages, "nl");

    const blogContent = document.getElementById("blog-content");
    expect(blogContent).not.toBeNull();
    expect(blogContent?.innerHTML).not.toContain("<img");
    expect(blogContent?.innerHTML).toContain("Tekst");
    expect(blogContent?.innerHTML).toContain("Meer tekst");
  });

  it("renders a back-to-blogs link", () => {
    renderPage(baseBlog, "nl");

    const link = screen.getByRole("link", {
      name: "I18N_Back_To_Blogs",
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", expect.stringContaining("blogs"));
  });

  it("does not render linked productions section when production_id_urls is empty", () => {
    renderPage(baseBlog, "nl");

    expect(
      screen.queryByRole("region", { name: "Linked productions" })
    ).not.toBeInTheDocument();
  });

  it("loads and renders linked productions", async () => {
    const getProductionByUrlMock = vi.mocked(getProductionByUrl);

    const mockProduction: Production = {
      id_url: "http://localhost/api/v1/archive/productions/1",
      performer_type: "Opera",
      production_infos: [
        {
          production_id_url: "http://localhost/api/v1/archive/productions/1",
          language: "nl",
          title: "Gekoppelde Productie",
          supertitle: "Collectie",
          artist: "Artiest",
          tagline: "Een tagline",
        },
      ],
      event_id_urls: [],
      tags: [],
    };

    getProductionByUrlMock.mockResolvedValue(mockProduction);

    renderPage(
      {
        ...baseBlog,
        production_id_urls: ["http://localhost/api/v1/archive/productions/1"],
      },
      "nl"
    );

    expect(
      await screen.findByRole("heading", { name: "Gekoppelde Productie" })
    ).toBeInTheDocument();
    expect(screen.getByText("Artiest")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Linked productions" })
    ).toBeInTheDocument();
    expect(screen.getByText("I18N_Blog_Productions")).toBeInTheDocument();
  });

  it("handles a failed production fetch gracefully and omits it from the list", async () => {
    const getProductionByUrlMock = vi.mocked(getProductionByUrl);

    getProductionByUrlMock.mockRejectedValue(new Error("Network error"));

    renderPage(
      {
        ...baseBlog,
        production_id_urls: ["http://localhost/api/v1/archive/productions/99"],
      },
      "nl"
    );

    await screen.findByTestId("blog-media-gallery");

    expect(
      screen.queryByRole("region", { name: "Linked productions" })
    ).not.toBeInTheDocument();
  });

  it("renders multiple linked productions", async () => {
    const getProductionByUrlMock = vi.mocked(getProductionByUrl);

    getProductionByUrlMock.mockImplementation(async (url: string) => ({
      id_url: url,
      performer_type: "Ballet",
      production_infos: [
        {
          production_id_url: url,
          language: "nl",
          title: url.endsWith("/2") ? "Productie Twee" : "Productie Één",
          supertitle: "Collectie",
          artist: url.endsWith("/2") ? "Artiest Twee" : "Artiest Één",
          tagline: "Een tagline",
        },
      ],
      event_id_urls: [],
      tags: [],
    }));

    renderPage(
      {
        ...baseBlog,
        production_id_urls: [
          "http://localhost/api/v1/archive/productions/1",
          "http://localhost/api/v1/archive/productions/2",
        ],
      },
      "nl"
    );

    expect(await screen.findByText("Productie Één")).toBeInTheDocument();
    expect(await screen.findByText("Productie Twee")).toBeInTheDocument();
    expect(screen.getByText("Artiest Één")).toBeInTheDocument();
    expect(screen.getByText("Artiest Twee")).toBeInTheDocument();
  });
});
