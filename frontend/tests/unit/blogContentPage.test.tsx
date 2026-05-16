import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BlogContentPage } from "~/features/blogs/pages/BlogContentPage";
import type { Blog } from "~/features/blogs/types/blogTypes";
import type { Production } from "~/features/archive/types/productionTypes";
import { AuthSessionProvider } from "~/features/auth";
import { updateBlogByUrl } from "~/features/blogs/services/blogService";
import {
  getAllProductionGroups,
  getProductionGroupByUrl,
  getProductionsForGroup,
} from "~/features/archive/services/productionGroupService";
import type { ProductionGroup } from "~/features/archive/types/productionGroupTypes";

vi.mock("~/features/blogs/services/blogService", () => ({
  updateBlogByUrl: vi.fn(),
}));

vi.mock("~/features/archive/services/productionGroupService", () => ({
  getAllProductionGroups: vi.fn(),
  getProductionGroupByUrl: vi.fn(),
  getProductionsForGroup: vi.fn(),
}));

vi.mock("~/features/blogs/components/BlogPageMediaGallery", () => ({
  BlogPageMediaGallery: ({ title }: { title: string }) => (
    <div data-testid="blog-media-gallery">Mock gallery for {title}</div>
  ),
}));

vi.mock("~/features/blogs/components/DeleteBlogButton", () => ({
  DeleteBlogButton: ({ blogId }: { blogId: number }) => (
    <button data-testid="delete-blog-button" data-blog-id={blogId}>
      Mock Delete
    </button>
  ),
}));

vi.mock("~/features/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/features/auth")>();
  return {
    ...actual,
    Protected: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock("dompurify", () => ({
  default: {
    sanitize: (html: string) => html,
  },
}));

vi.mock("~/shared/components/ComplexEditableField", () => ({
  default: ({
    html,
    isEditing,
    onSave,
    fallback,
  }: {
    html?: string;
    isEditing: boolean;
    onSave: (html: string) => void;
    fallback: React.ReactNode;
  }) =>
    isEditing ? (
      <div>
        <div
          data-testid="content-editor"
          dangerouslySetInnerHTML={{ __html: html ?? "" }}
        />
        <button
          data-testid="save-content-btn"
          onClick={() => onSave("<p>Updated content</p>")}
        >
          Save content
        </button>
      </div>
    ) : html ? (
      <div dangerouslySetInnerHTML={{ __html: html }} />
    ) : (
      <>{fallback}</>
    ),
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

  return {
    user: userEvent.setup(),
    ...render(
      <AuthSessionProvider>
        <RouterProvider router={router} />
      </AuthSessionProvider>
    ),
  };
}

const baseBlog: Blog = {
  id_url: "http://localhost/api/v1/blogs/1",
  series_id_url: "",
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
  series_id_url: "",
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
  series_id_url: "",
  blog_contents: [
    {
      language: "nl",
      title: "Blog Zonder Inhoud",
      content: "",
      blog_id_url: "http://localhost/api/v1/blogs/1",
    },
  ],
};

const baseProdGroup: ProductionGroup = {
  id_url: "http://localhost/api/v1/production-groups/1",
  title: "foo",
  is_public_filter: true,
  production_id_urls: [],
};

describe("BlogContentPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(getAllProductionGroups).mockResolvedValue([]);
    vi.mocked(getProductionGroupByUrl).mockResolvedValue(baseProdGroup);
    vi.mocked(getProductionsForGroup).mockResolvedValue([]);
    vi.mocked(updateBlogByUrl).mockResolvedValue(baseBlog);
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

  it("loads and renders linked productions via series", async () => {
    const getProductionsForGroupMock = vi.mocked(getProductionsForGroup);
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
    getProductionsForGroupMock.mockResolvedValue([mockProduction]);
    renderPage(
      {
        ...baseBlog,
        series_id_url: "http://localhost/api/v1/archive/production-groups/1",
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
    const getProductionsForGroupMock = vi.mocked(getProductionsForGroup);
    getProductionsForGroupMock.mockRejectedValue(new Error("Network error"));
    renderPage(
      {
        ...baseBlog,
        series_id_url: "http://localhost/api/v1/archive/production-groups/99",
      },
      "nl"
    );
    await screen.findByTestId("blog-media-gallery");
    expect(
      screen.queryByRole("region", { name: "Linked productions" })
    ).not.toBeInTheDocument();
  });

  it("renders multiple linked productions", async () => {
    const getProductionsForGroupMock = vi.mocked(getProductionsForGroup);
    getProductionsForGroupMock.mockResolvedValue([
      {
        id_url: "http://localhost/api/v1/archive/productions/1",
        performer_type: "Ballet",
        production_infos: [
          {
            production_id_url: "http://localhost/api/v1/archive/productions/1",
            language: "nl",
            title: "Productie Één",
            supertitle: "Collectie",
            artist: "Artiest Één",
            tagline: "Een tagline",
          },
        ],
        event_id_urls: [],
        tags: [],
      },
      {
        id_url: "http://localhost/api/v1/archive/productions/2",
        performer_type: "Ballet",
        production_infos: [
          {
            production_id_url: "http://localhost/api/v1/archive/productions/2",
            language: "nl",
            title: "Productie Twee",
            supertitle: "Collectie",
            artist: "Artiest Twee",
            tagline: "Een tagline",
          },
        ],
        event_id_urls: [],
        tags: [],
      },
    ]);
    renderPage(
      {
        ...baseBlog,
        series_id_url: "http://localhost/api/v1/archive/production-groups/1",
      },
      "nl"
    );
    expect(await screen.findByText("Productie Één")).toBeInTheDocument();
    expect(await screen.findByText("Productie Twee")).toBeInTheDocument();
    expect(screen.getByText("Artiest Één")).toBeInTheDocument();
    expect(screen.getByText("Artiest Twee")).toBeInTheDocument();
  });

  it("renders the delete blog button when blog has a valid numeric id", async () => {
    renderPage(baseBlog, "nl");

    expect(screen.getByTestId("delete-blog-button")).toBeInTheDocument();
    expect(screen.getByTestId("delete-blog-button")).toHaveAttribute(
      "data-blog-id",
      "1"
    );
  });

  it("does not render the delete blog button when blog id_url has no numeric id", async () => {
    const blogWithoutNumericId: Blog = {
      ...baseBlog,
      id_url: "http://localhost/api/v1/blogs/invalid",
    };
    renderPage(blogWithoutNumericId, "nl");

    expect(screen.queryByTestId("delete-blog-button")).not.toBeInTheDocument();
  });

  describe("edit functionality", () => {
    it("shows the edit button when originalContent exists", () => {
      renderPage(baseBlog);

      expect(document.getElementById("edit-blog-button")).toBeInTheDocument();
    });

    it("switches to edit mode when the edit button is clicked", async () => {
      const { user } = renderPage(baseBlog);

      await user.click(document.getElementById("edit-blog-button")!);

      expect(document.getElementById("edit-actions")).toBeInTheDocument();
      expect(screen.getAllByRole("textbox")[0]).toBeInTheDocument();
    });

    it("exits edit mode when cancel is clicked without calling updateBlogByUrl", async () => {
      const { user } = renderPage(baseBlog);

      await user.click(document.getElementById("edit-blog-button")!);
      await user.click(document.getElementById("cancel-edit-blog-button")!);

      expect(document.getElementById("edit-blog-button")).toBeInTheDocument();
      expect(vi.mocked(updateBlogByUrl)).not.toHaveBeenCalled();
    });

    it("restores the original title when cancel is clicked after editing", async () => {
      const { user } = renderPage(baseBlog);

      await user.click(document.getElementById("edit-blog-button")!);
      const input = screen.getAllByRole("textbox")[0];
      await user.clear(input);
      await user.type(input, "Gewijzigde Titel");
      await user.click(document.getElementById("cancel-edit-blog-button")!);

      expect(
        screen.getByRole("heading", { name: "Nederlandse Blog Titel" })
      ).toBeInTheDocument();
    });

    it("reflects title changes in the input while editing", async () => {
      const { user } = renderPage(baseBlog);

      await user.click(document.getElementById("edit-blog-button")!);
      const input = screen.getAllByRole("textbox")[0];
      await user.clear(input);
      await user.type(input, "Nieuwe Titel");

      expect(input).toHaveValue("Nieuwe Titel");
    });

    it("shows the modified indicator when the title is changed", async () => {
      const { user } = renderPage(baseBlog);

      await user.click(document.getElementById("edit-blog-button")!);
      const input = screen.getAllByRole("textbox")[0];
      await user.clear(input);
      await user.type(input, "Gewijzigde Titel");

      expect(screen.getByText("I18N_Modified")).toBeInTheDocument();
    });

    it("does not show the modified indicator when the title is unchanged", async () => {
      const { user } = renderPage(baseBlog);

      await user.click(document.getElementById("edit-blog-button")!);

      expect(screen.queryByText("I18N_Modified")).not.toBeInTheDocument();
    });

    it("keeps the save button disabled when nothing has been modified", async () => {
      const { user } = renderPage(baseBlog);

      await user.click(document.getElementById("edit-blog-button")!);

      expect(document.getElementById("save-edit-blog-button")).toBeDisabled();
    });

    it("enables the save button after the title is changed", async () => {
      const { user } = renderPage(baseBlog);

      await user.click(document.getElementById("edit-blog-button")!);
      const input = screen.getAllByRole("textbox")[0];
      await user.clear(input);
      await user.type(input, "Nieuwe Titel");

      expect(document.getElementById("save-edit-blog-button")).not.toBeDisabled();
    });

    it("enables the save button after the content is changed", async () => {
      const { user } = renderPage(baseBlog);

      await user.click(document.getElementById("edit-blog-button")!);
      await user.click(screen.getByTestId("save-content-btn"));

      expect(document.getElementById("save-edit-blog-button")).not.toBeDisabled();
    });

    it("calls updateBlogByUrl with the updated title on save", async () => {
      const { user } = renderPage(baseBlog);

      await user.click(document.getElementById("edit-blog-button")!);
      const input = screen.getAllByRole("textbox")[0];
      await user.clear(input);
      await user.type(input, "Opgeslagen Titel");
      await user.click(document.getElementById("save-edit-blog-button")!);

      await waitFor(() => {
        expect(vi.mocked(updateBlogByUrl)).toHaveBeenCalledWith(
          baseBlog.id_url,
          expect.objectContaining({
            blog_contents: expect.arrayContaining([
              expect.objectContaining({ title: "Opgeslagen Titel", language: "nl" }),
            ]),
          })
        );
      });
    });

    it("calls updateBlogByUrl with the updated content on save", async () => {
      const { user } = renderPage(baseBlog);

      await user.click(document.getElementById("edit-blog-button")!);
      await user.click(screen.getByTestId("save-content-btn"));
      await user.click(document.getElementById("save-edit-blog-button")!);

      await waitFor(() => {
        expect(vi.mocked(updateBlogByUrl)).toHaveBeenCalledWith(
          baseBlog.id_url,
          expect.objectContaining({
            blog_contents: expect.arrayContaining([
              expect.objectContaining({ content: "<p>Updated content</p>" }),
            ]),
          })
        );
      });
    });

    it("exits edit mode after a successful save", async () => {
      const { user } = renderPage(baseBlog);

      await user.click(document.getElementById("edit-blog-button")!);
      const input = screen.getAllByRole("textbox")[0];
      await user.clear(input);
      await user.type(input, "Opgeslagen Titel");
      await user.click(document.getElementById("save-edit-blog-button")!);

      await waitFor(() => {
        expect(document.getElementById("edit-blog-button")).toBeInTheDocument();
      });
    });

    it("reflects the saved title in the heading after a successful save", async () => {
      const { user } = renderPage(baseBlog);

      await user.click(document.getElementById("edit-blog-button")!);
      const input = screen.getAllByRole("textbox")[0];
      await user.clear(input);
      await user.type(input, "Definitieve Titel");
      await user.click(document.getElementById("save-edit-blog-button")!);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Definitieve Titel" })
        ).toBeInTheDocument();
      });
    });

    it("shows an alert and stays in edit mode when the save request fails", async () => {
      vi.mocked(updateBlogByUrl).mockRejectedValue(new Error("Server error"));
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      const { user } = renderPage(baseBlog);

      await user.click(document.getElementById("edit-blog-button")!);
      const input = screen.getAllByRole("textbox")[0];
      await user.clear(input);
      await user.type(input, "Fout Titel");
      await user.click(document.getElementById("save-edit-blog-button")!);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("Save failed"));
      });
      expect(document.getElementById("edit-actions")).toBeInTheDocument();
    });

    it("disables the save button while saving is in progress", async () => {
      let resolveSave!: (blog: Blog) => void;
      vi.mocked(updateBlogByUrl).mockReturnValue(
        new Promise<Blog>((resolve) => {
          resolveSave = resolve;
        })
      );
      const { user } = renderPage(baseBlog);

      await user.click(document.getElementById("edit-blog-button")!);
      const input = screen.getAllByRole("textbox")[0];
      await user.clear(input);
      await user.type(input, "Bezig met Opslaan");
      await user.click(document.getElementById("save-edit-blog-button")!);

      expect(document.getElementById("save-edit-blog-button")).toBeDisabled();

      resolveSave(baseBlog);
    });
  });

  describe("add content functionality", () => {
    it("shows the add button when no content exists for the language", () => {
      renderPage(baseBlogOneLanguage, "en");

      expect(document.getElementById("edit-blog-button")).toBeInTheDocument();
    });

    it("switches to edit mode when the add button is clicked", async () => {
      const { user } = renderPage(baseBlogOneLanguage, "en");

      await user.click(document.getElementById("edit-blog-button")!);

      expect(document.getElementById("edit-actions")).toBeInTheDocument();
    });

    it("keeps the save button disabled when neither title nor content has been filled in", async () => {
      const { user } = renderPage(baseBlogOneLanguage, "en");

      await user.click(document.getElementById("edit-blog-button")!);

      expect(document.getElementById("save-edit-blog-button")).toBeDisabled();
    });

    it("keeps the save button disabled when only the title is filled in", async () => {
      const { user } = renderPage(baseBlogOneLanguage, "en");

      await user.click(document.getElementById("edit-blog-button")!);
      const input = screen.getAllByRole("textbox")[0];
      await user.type(input, "Nieuwe Titel");

      expect(document.getElementById("save-edit-blog-button")).toBeDisabled();
    });

    it("keeps the save button disabled when only the content is filled in", async () => {
      const { user } = renderPage(baseBlogOneLanguage, "en");

      await user.click(document.getElementById("edit-blog-button")!);
      await user.click(screen.getByTestId("save-content-btn"));

      expect(document.getElementById("save-edit-blog-button")).toBeDisabled();
    });

    it("enables the save button when both title and content are filled in", async () => {
      const { user } = renderPage(baseBlogOneLanguage, "en");

      await user.click(document.getElementById("edit-blog-button")!);
      const input = screen.getAllByRole("textbox")[0];
      await user.type(input, "Nieuwe Titel");
      await user.click(screen.getByTestId("save-content-btn"));

      expect(document.getElementById("save-edit-blog-button")).not.toBeDisabled();
    });

    it("calls updateBlogByUrl with the new title and content on save", async () => {
      const { user } = renderPage(baseBlogOneLanguage, "en");

      await user.click(document.getElementById("edit-blog-button")!);
      const input = screen.getAllByRole("textbox")[0];
      await user.type(input, "Nieuwe Titel");
      await user.click(screen.getByTestId("save-content-btn"));
      await user.click(document.getElementById("save-edit-blog-button")!);

      await waitFor(() => {
        expect(vi.mocked(updateBlogByUrl)).toHaveBeenCalledWith(
          baseBlogOneLanguage.id_url,
          expect.objectContaining({
            blog_contents: expect.arrayContaining([
              expect.objectContaining({
                language: "en",
                title: "Nieuwe Titel",
                content: "<p>Updated content</p>",
              }),
            ]),
          })
        );
      });
    });

    it("exits edit mode after a successful add save", async () => {
      const { user } = renderPage(baseBlogOneLanguage, "en");

      await user.click(document.getElementById("edit-blog-button")!);
      const input = screen.getAllByRole("textbox")[0];
      await user.type(input, "Nieuwe Titel");
      await user.click(screen.getByTestId("save-content-btn"));
      await user.click(document.getElementById("save-edit-blog-button")!);

      await waitFor(() => {
        expect(document.getElementById("edit-actions")).not.toBeInTheDocument();
      });
    });

    it("shows an alert and stays in edit mode when the add save request fails", async () => {
      vi.mocked(updateBlogByUrl).mockRejectedValue(new Error("Server error"));
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      const { user } = renderPage(baseBlogOneLanguage, "en");

      await user.click(document.getElementById("edit-blog-button")!);
      const input = screen.getAllByRole("textbox")[0];
      await user.type(input, "Nieuwe Titel");
      await user.click(screen.getByTestId("save-content-btn"));
      await user.click(document.getElementById("save-edit-blog-button")!);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("Save failed"));
      });
      expect(document.getElementById("edit-actions")).toBeInTheDocument();
    });
  });

  describe("edit groups functionality", () => {
    it("enables the save button when selected production is changed", async () => {
      vi.mocked(getAllProductionGroups).mockResolvedValue([
        {
          id_url: "http://localhost/api/v1/production-groups/1",
          title: "foo",
          is_public_filter: true,
          production_id_urls: [],
        },
        {
          id_url: "http://localhost/api/v1/production-groups/2",
          title: "bar",
          is_public_filter: true,
          production_id_urls: [],
        },
      ]);
      const { user } = renderPage(baseBlogOneLanguage, "nl");

      await user.click(document.getElementById("edit-blog-button")!);
      const input = screen.getAllByRole("textbox")[1];
      await user.type(input, "bar");
      await user.click(screen.getByText("bar", { selector: "li" }));

      expect(document.getElementById("save-edit-blog-button")).not.toBeDisabled();
    });

    it("calls updateBlogByUrl with the new production group on save", async () => {
      vi.mocked(getAllProductionGroups).mockResolvedValue([
        {
          id_url: "http://localhost/api/v1/production-groups/1",
          title: "foo",
          is_public_filter: true,
          production_id_urls: [],
        },
        {
          id_url: "http://localhost/api/v1/production-groups/2",
          title: "bar",
          is_public_filter: true,
          production_id_urls: [],
        },
      ]);
      const { user } = renderPage(baseBlogOneLanguage, "nl");

      await user.click(document.getElementById("edit-blog-button")!);
      const input = screen.getAllByRole("textbox")[1];
      await user.type(input, "bar");
      await user.click(screen.getByText("bar", { selector: "li" }));

      await user.click(document.getElementById("save-edit-blog-button")!);

      await waitFor(() => {
        expect(vi.mocked(updateBlogByUrl)).toHaveBeenCalledWith(
          baseBlogOneLanguage.id_url,
          expect.objectContaining({
            blog_contents: expect.arrayContaining([
              expect.objectContaining({
                language: "en",
                title: "Nieuwe Titel",
                content: "<p>Updated content</p>",
              }),
            ]),
          })
        );
      });
    });
  });
});
