import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CreateBlogAccessDenied,
  CreateBlogPage,
} from "~/features/blogs/pages/CreateBlogPage";
import { AuthSessionProvider } from "~/features/auth";
import { createBlog } from "~/features/blogs/services/blogService";
import { uploadMediaForBlog } from "~/features/blogs/services/mediaService";
import { getAllProductionGroups } from "~/features/archive/services/productionGroupService";
import type { Blog } from "~/features/blogs/types/blogTypes";
import type { ProductionGroup } from "~/features/archive/types/productionGroupTypes";
import type { MediaItem } from "~/features/archive/types/mediaTypes";

vi.mock("~/features/blogs/services/blogService", () => ({
  createBlog: vi.fn(),
}));

vi.mock("~/features/blogs/services/mediaService", () => ({
  uploadMediaForBlog: vi.fn(),
}));

vi.mock("~/features/archive/services/productionGroupService", () => ({
  getAllProductionGroups: vi.fn(),
}));

vi.mock("~/features/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/features/auth")>();
  return {
    ...actual,
    Protected: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock("~/shared/components/ComplexEditableField", () => ({
  default: ({
    html,
    isEditing,
    onStartEdit,
    onSave,
    onCancel,
  }: {
    html?: string;
    isEditing: boolean;
    onStartEdit: () => void;
    onSave: (html: string) => void;
    onCancel: () => void;
    fallback?: React.ReactNode;
  }) =>
    isEditing ? (
      <div>
        <div
          data-testid="content-editor"
          dangerouslySetInnerHTML={{ __html: html ?? "" }}
        />
        <button
          data-testid="save-content-btn"
          onClick={() => onSave("<p>Blog content</p>")}
        >
          Save content
        </button>
        <button data-testid="cancel-content-btn" onClick={onCancel}>
          Cancel content
        </button>
      </div>
    ) : (
      <div
        data-testid="content-preview"
        onClick={onStartEdit}
        dangerouslySetInnerHTML={{ __html: html ?? "" }}
      />
    ),
}));

vi.mock("~/features/archive/utils/productionPageFunctions", () => ({
  useUnsavedChangesBlocker: vi.fn(),
}));

const mockCreatedBlog: Blog = {
  id_url: "http://localhost/api/v1/blogs/42",
  production_group_id_url: "",
  blog_contents: [
    {
      language: "nl",
      title: "New Blog",
      content: "<p>Blog content</p>",
      blog_id_url: "http://localhost/api/v1/blogs/42",
    },
  ],
};

const mockProductionGroups: ProductionGroup[] = [
  {
    id_url: "http://localhost/api/v1/archive/production-groups/1",
    title: "Seizoen 2024",
    is_public_filter: true,
    production_id_urls: [],
  },
  {
    id_url: "http://localhost/api/v1/archive/production-groups/2",
    title: "Zomerprogramma",
    is_public_filter: true,
    production_id_urls: [],
  },
];

const mockMediaItem: MediaItem = {
  id_url: "/api/v1/archive/productions/1/media/1",
  url: "http://localhost/media/poster.jpg",
  production_id_url: "/api/v1/archive/productions/1",
  blog_id_url: null,
  content_type: "image/jpeg",
  uploaded_at: "2026-03-29T14:00:00",
};

function renderPage(lang: string = "nl") {
  const router = createMemoryRouter(
    [
      {
        path: "/:lang/blogs/create",
        element: <CreateBlogPage />,
      },
      {
        path: "/:lang/blogs",
        element: <div data-testid="blogs-list-page">Blogs list</div>,
      },
    ],
    {
      initialEntries: [`/${lang}/blogs/create`],
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

describe("CreateBlogPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(createBlog).mockResolvedValue(mockCreatedBlog);
    vi.mocked(uploadMediaForBlog).mockResolvedValue(mockMediaItem);
    vi.mocked(getAllProductionGroups).mockResolvedValue(mockProductionGroups);
  });

  it("renders the page heading", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders a back-to-blogs link", () => {
    renderPage();

    const link = screen.getByRole("link", { name: "I18N_Back_To_Blogs" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", expect.stringContaining("blogs"));
  });

  it("renders the title input", () => {
    renderPage();

    expect(screen.getByPlaceholderText("I18N_Title_Placeholder")).toBeInTheDocument();
  });

  it("renders the content editor", () => {
    renderPage();

    expect(screen.getByTestId("content-editor")).toBeInTheDocument();
  });

  it("renders the media upload widget", () => {
    renderPage();

    expect(screen.getByText("I18N_Media_Title")).toBeInTheDocument();
  });

  it("renders the series search bar", () => {
    renderPage();

    expect(screen.getByPlaceholderText("I18N_Search_Series")).toBeInTheDocument();
  });

  it("switches back to editing mode when the content cancel editor is clicked", async () => {
    const { user } = renderPage();

    await user.click(screen.getByTestId("save-content-btn"));
    expect(screen.getByTestId("content-preview")).toBeInTheDocument();

    await user.click(screen.getByTestId("content-preview"));
    expect(screen.getByTestId("content-editor")).toBeInTheDocument();
  });

  it("switches back to preview mode when the content cancel button is clicked", async () => {
    const { user } = renderPage();

    await user.click(screen.getByTestId("save-content-btn"));
    expect(screen.getByTestId("content-preview")).toBeInTheDocument();

    await user.click(screen.getByTestId("content-preview"));
    expect(screen.getByTestId("content-editor")).toBeInTheDocument();

    await user.click(screen.getByTestId("cancel-content-btn"));
    expect(screen.getByTestId("content-preview")).toBeInTheDocument();
  });

  describe("save button state", () => {
    it("renders the save button", () => {
      renderPage();

      expect(
        screen.getByRole("button", { name: "I18N_Save_Blog" })
      ).toBeInTheDocument();
    });

    it("disables the save button when the title is empty and still editing", () => {
      renderPage();

      expect(screen.getByRole("button", { name: "I18N_Save_Blog" })).toBeDisabled();
    });

    it("disables the save button when editing content but no title is set", async () => {
      const { user } = renderPage();

      await user.click(screen.getByTestId("save-content-btn"));

      expect(screen.getByRole("button", { name: "I18N_Save_Blog" })).toBeDisabled();
    });

    it("disables the save button while in editing mode even with a title", async () => {
      const { user } = renderPage();

      const titleInput = screen.getByPlaceholderText("I18N_Title_Placeholder");
      await user.type(titleInput, "My Blog Title");

      // ComplexEditableField starts in editing mode, so canSave should still be false
      expect(screen.getByRole("button", { name: "I18N_Save_Blog" })).toBeDisabled();
    });

    it("enables the save button once a title is provided and editing is finished", async () => {
      const { user } = renderPage();

      const titleInput = screen.getByPlaceholderText("I18N_Title_Placeholder");
      await user.type(titleInput, "My Blog Title");
      await user.click(screen.getByTestId("save-content-btn"));

      expect(screen.getByRole("button", { name: "I18N_Save_Blog" })).not.toBeDisabled();
    });
  });

  describe("saving a blog", () => {
    it("calls createBlog with the entered title and content on save", async () => {
      const { user } = renderPage("en");

      const titleInput = screen.getByPlaceholderText("I18N_Title_Placeholder");
      await user.type(titleInput, "My New Blog");
      await user.click(screen.getByTestId("save-content-btn"));
      await user.click(screen.getByRole("button", { name: "I18N_Save_Blog" }));

      await waitFor(() => {
        expect(vi.mocked(createBlog)).toHaveBeenCalledWith(
          expect.objectContaining({
            blog_content: expect.objectContaining({
              title: "My New Blog",
              content: "<p>Blog content</p>",
              language: "en",
            }),
          })
        );
      });
    });

    it("uses the correct language from the URL param", async () => {
      const { user } = renderPage("nl");

      const titleInput = screen.getByPlaceholderText("I18N_Title_Placeholder");
      await user.type(titleInput, "Nederlandse Blog");
      await user.click(screen.getByTestId("save-content-btn"));
      await user.click(screen.getByRole("button", { name: "I18N_Save_Blog" }));

      await waitFor(() => {
        expect(vi.mocked(createBlog)).toHaveBeenCalledWith(
          expect.objectContaining({
            blog_content: expect.objectContaining({ language: "nl" }),
          })
        );
      });
    });

    it("navigates to the blogs list after a successful save", async () => {
      const { user } = renderPage();

      const titleInput = screen.getByPlaceholderText("I18N_Title_Placeholder");
      await user.type(titleInput, "My New Blog");
      await user.click(screen.getByTestId("save-content-btn"));
      await user.click(screen.getByRole("button", { name: "I18N_Save_Blog" }));

      await waitFor(() => {
        expect(screen.getByTestId("blogs-list-page")).toBeInTheDocument();
      });
    });

    it("shows an alert and stays on the page when the save request fails", async () => {
      vi.mocked(createBlog).mockRejectedValue(new Error("Server error"));
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      const { user } = renderPage();

      const titleInput = screen.getByPlaceholderText("I18N_Title_Placeholder");
      await user.type(titleInput, "My New Blog");
      await user.click(screen.getByTestId("save-content-btn"));
      await user.click(screen.getByRole("button", { name: "I18N_Save_Blog" }));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("Save failed"));
      });
      expect(
        screen.getByRole("button", { name: "I18N_Save_Blog" })
      ).toBeInTheDocument();
    });

    it("shows a preview after a file is uploaded", async () => {
      const { user } = renderPage();

      const file = new File(["image content"], "photo.jpg", { type: "image/jpeg" });
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await user.upload(fileInput, file);

      expect(document.querySelector("img")).toBeInTheDocument();
    });

    it("removes a media preview when its remove button is clicked", async () => {
      const { user } = renderPage();

      const file = new File(["image content"], "photo.jpg", { type: "image/jpeg" });
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await user.upload(fileInput, file);

      expect(document.querySelector("img")).toBeInTheDocument();

      const removeButton = document.querySelector(".MuiIconButton-root") as HTMLElement;
      await user.click(removeButton);

      expect(document.querySelector("img")).not.toBeInTheDocument();
    });
  });

  it("calls uploadMediaForBlog for each attached file after the blog is created", async () => {
    const { user } = renderPage();

    const fileA = new File(["a"], "a.jpg", { type: "image/jpeg" });
    const fileB = new File(["b"], "b.jpg", { type: "image/jpeg" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, [fileA, fileB]);

    const titleInput = screen.getByPlaceholderText(/I18N_Title_Placeholder/i);
    await user.type(titleInput, "Blog With Media");
    await user.click(screen.getByTestId("save-content-btn"));
    await user.click(screen.getByRole("button", { name: /I18N_Save/i }));

    await waitFor(() => {
      expect(vi.mocked(uploadMediaForBlog)).toHaveBeenCalledTimes(2);
      expect(vi.mocked(uploadMediaForBlog)).toHaveBeenCalledWith(42, fileA);
      expect(vi.mocked(uploadMediaForBlog)).toHaveBeenCalledWith(42, fileB);
    });
  });

  it("applies dragging styles when a file is dragged over the drop zone", async () => {
    renderPage();

    const dropZone = document.querySelector('input[type="file"]')!.parentElement!;
    fireEvent.dragOver(dropZone, { preventDefault: () => {} });

    expect(dropZone).toHaveClass("border-archive-accent");
  });

  it("removes dragging styles when the drag leaves the drop zone", async () => {
    renderPage();

    const dropZone = document.querySelector('input[type="file"]')!.parentElement!;
    fireEvent.dragOver(dropZone, { preventDefault: () => {} });
    fireEvent.dragLeave(dropZone);

    expect(dropZone).not.toHaveClass("border-archive-accent");
  });

  it("shows a preview when a file is dropped onto the drop zone", async () => {
    renderPage();

    const file = new File(["image content"], "photo.jpg", { type: "image/jpeg" });
    const dropZone = document.querySelector('input[type="file"]')!.parentElement!;
    fireEvent.drop(dropZone, {
      preventDefault: () => {},
      dataTransfer: { files: [file] },
    });

    expect(document.querySelector("img")).toBeInTheDocument();
  });

  describe("series search bar", () => {
    it("loads and displays matching production groups as the user types", async () => {
      const { user } = renderPage();

      const searchInput = screen.getByPlaceholderText("I18N_Search_Series");
      await user.click(searchInput);
      await user.type(searchInput, "Seizoen");

      await waitFor(() => {
        // regex because there is an x added
        expect(screen.getByText(/Seizoen 2024/i)).toBeInTheDocument();
      });
    });

    it("does not show results that do not match the query", async () => {
      const { user } = renderPage();

      const searchInput = screen.getByPlaceholderText("I18N_Search_Series");
      await user.click(searchInput);
      await user.type(searchInput, "Seizoen");

      await waitFor(() => {
        // regex because there is an x added
        expect(screen.queryByText(/Zomerprogramma/i)).not.toBeInTheDocument();
      });
    });

    it("selects a production group when a result is clicked", async () => {
      const { user } = renderPage();

      const searchInput = screen.getByPlaceholderText("I18N_Search_Series");
      await user.click(searchInput);
      await user.type(searchInput, "Seizoen");

      await waitFor(() => screen.getByText("Seizoen 2024"));
      await user.click(screen.getByText("Seizoen 2024"));

      // regex because there is an x added
      expect(screen.getByText(/Seizoen 2024/i)).toBeInTheDocument();
    });

    it("includes the production group id in the createBlog call when a series is selected", async () => {
      const { user } = renderPage();

      const searchInput = screen.getByPlaceholderText("I18N_Search_Series");
      await user.click(searchInput);
      await user.type(searchInput, "Seizoen");

      await waitFor(() => screen.getByText("Seizoen 2024"));
      await user.click(screen.getByText("Seizoen 2024"));

      const titleInput = screen.getByPlaceholderText("I18N_Title_Placeholder");
      await user.type(titleInput, "My New Blog");
      await user.click(screen.getByTestId("save-content-btn"));
      await user.click(screen.getByRole("button", { name: "I18N_Save_Blog" }));

      await waitFor(() => {
        expect(vi.mocked(createBlog)).toHaveBeenCalledWith(
          expect.objectContaining({
            production_group_id_url:
              "http://localhost/api/v1/archive/production-groups/1",
          })
        );
      });
    });

    it("deselects a production group when the clear button is clicked", async () => {
      const { user } = renderPage();

      const searchInput = screen.getByPlaceholderText("I18N_Search_Series");
      await user.click(searchInput);
      await user.type(searchInput, "Seizoen");

      await waitFor(() => screen.getByText("Seizoen 2024"));
      await user.click(screen.getByText("Seizoen 2024"));

      // regex because there is an x added
      const clearButton = screen.getByRole("button", { name: /Seizoen 2024/i });
      await user.click(clearButton);

      expect(
        screen.queryByRole("button", { name: /Seizoen 2024/i })
      ).not.toBeInTheDocument();
    });

    it("gracefully handles a failed production group fetch", async () => {
      vi.mocked(getAllProductionGroups).mockRejectedValue(new Error("Network error"));
      const { user } = renderPage();

      const searchInput = screen.getByPlaceholderText("I18N_Search_Series");
      await user.click(searchInput);
      await user.type(searchInput, "Seizoen");

      // No results should appear and the page should still render
      expect(screen.queryByText("Seizoen 2024")).not.toBeInTheDocument();
      expect(searchInput).toBeInTheDocument();
    });
  });

  it("renders the CreateBlogAccessDenied section with heading and description", () => {
    const router = createMemoryRouter(
      [{ path: "/", element: <CreateBlogAccessDenied /> }],
      { initialEntries: ["/"] }
    );
    render(
      <AuthSessionProvider>
        <RouterProvider router={router} />
      </AuthSessionProvider>
    );

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText("I18N_Blog_AccessDenied_Description")).toBeInTheDocument();
  });
});
