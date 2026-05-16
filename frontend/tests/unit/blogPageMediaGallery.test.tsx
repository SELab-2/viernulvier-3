import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BlogPageMediaGallery } from "~/features/blogs/components/BlogPageMediaGallery";
import type { MediaList } from "~/features/archive/types/mediaTypes";
import {
  deleteMediaForBlog,
  getMediaForBlog,
  uploadMediaForBlog,
} from "~/features/blogs/services/mediaService";

vi.mock("~/features/blogs/services/mediaService", () => ({
  getMediaForBlog: vi.fn(),
  deleteMediaForBlog: vi.fn(),
  uploadMediaForBlog: vi.fn(),
}));

const BLOG_ID_URL = "http://localhost/api/v1/blogs/1";

const baseMediaResponse: MediaList = {
  media: [
    {
      id_url: "http://localhost/api/v1/blogs/1/media/10",
      url: "https://example.com/image1.jpg",
      production_id_url: null,
      blog_id_url: BLOG_ID_URL,
      content_type: "image/jpeg",
      uploaded_at: "2026-03-29T14:00:00",
    },
    {
      id_url: "http://localhost/api/v1/blogs/1/media/11",
      url: "https://example.com/image2.jpg",
      production_id_url: null,
      blog_id_url: BLOG_ID_URL,
      content_type: "image/jpeg",
      uploaded_at: "2026-03-29T14:00:00",
    },
  ],
  pagination: {
    has_more: false,
    next_cursor: undefined,
    total_count: 2,
  },
};

const baseProps = {
  contentHtml: "",
  title: "Test Blog",
  blog_id_url: BLOG_ID_URL,
  setMediaEdited: vi.fn(),
};

function renderGallery(props: Partial<typeof baseProps & { isEditing: boolean }> = {}) {
  return {
    user: userEvent.setup(),
    ...render(<BlogPageMediaGallery {...baseProps} isEditing={false} {...props} />),
  };
}

describe("BlogPageMediaGallery", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(getMediaForBlog).mockResolvedValue(baseMediaResponse);
    vi.mocked(deleteMediaForBlog).mockResolvedValue(undefined);
    vi.mocked(uploadMediaForBlog).mockResolvedValue({
      id_url: "http://localhost/api/v1/blogs/1/media/99",
      url: "https://example.com/uploaded.jpg",
      content_type: "image/jpeg",
      production_id_url: null,
      blog_id_url: BLOG_ID_URL,
      uploaded_at: "2026-03-29T14:00:00",
    });
  });

  describe("view mode (isEditing: false)", () => {
    it("fetches media from the service", () => {
      renderGallery({ isEditing: false });

      expect(vi.mocked(getMediaForBlog)).toHaveBeenCalled();
    });

    it("does not render the upload button", () => {
      renderGallery({ isEditing: false });

      expect(
        screen.queryByRole("button", { name: "I18N_Upload_Media" })
      ).not.toBeInTheDocument();
    });

    it("does not render delete buttons on images", () => {
      renderGallery({
        isEditing: false,
        contentHtml: '<img src="https://example.com/content.jpg" />',
      });

      expect(
        screen.queryByRole("button", { name: "I18N_Delete_Media" })
      ).not.toBeInTheDocument();
    });

    it("deduplicates images that appear in both contentHtml and media", () => {
      renderGallery({
        isEditing: false,
        contentHtml: '<img src="https://example.com/image1.jpg" />',
      });

      const images = screen.getAllByRole("img");
      const srcs = images.map((img) => img.getAttribute("src"));
      const unique = new Set(srcs);
      expect(unique.size).toBe(srcs.length);
    });
  });

  describe("edit mode (isEditing: true)", () => {
    it("fetches media from the service on mount", async () => {
      renderGallery({ isEditing: true });

      await waitFor(() => {
        expect(vi.mocked(getMediaForBlog)).toHaveBeenCalledWith(1, expect.any(Object));
      });
    });

    it("renders the upload button", async () => {
      renderGallery({ isEditing: true });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "I18N_Upload_Media" })
        ).toBeInTheDocument();
      });
    });

    it("renders a delete button on each fetched media image", async () => {
      renderGallery({ isEditing: true });

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole("button", {
          name: "I18N_Delete_Media",
        });
        expect(deleteButtons).toHaveLength(2);
      });
    });

    it("shows the no-media message when fetch returns no images", async () => {
      vi.mocked(getMediaForBlog).mockResolvedValue({
        media: [],
        pagination: { has_more: false, next_cursor: undefined, total_count: 0 },
      });

      renderGallery({ isEditing: true });

      expect(await screen.findByText("I18N_No_Media")).toBeInTheDocument();
    });

    it("shows the no-media message when the fetch fails", async () => {
      vi.mocked(getMediaForBlog).mockRejectedValue(new Error("Network error"));

      renderGallery({ isEditing: true });

      expect(await screen.findByText("I18N_No_Media")).toBeInTheDocument();
    });
  });

  describe("delete functionality", () => {
    it("opens a confirmation dialog when the delete button is clicked", async () => {
      const { user } = renderGallery({ isEditing: true });

      const deleteButton = await screen.findAllByRole("button", {
        name: "I18N_Delete_Media",
      });
      await user.click(deleteButton[0]);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("I18N_Confirm_Title")).toBeInTheDocument();
      expect(screen.getByText("I18N_Confirm_Body")).toBeInTheDocument();
    });

    it("closes the dialog without deleting when cancel is clicked", async () => {
      const { user } = renderGallery({ isEditing: true });

      const deleteButton = await screen.findAllByRole("button", {
        name: "I18N_Delete_Media",
      });
      await user.click(deleteButton[0]);
      await user.click(screen.getByRole("button", { name: "I18N_Edit_Cancel" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(vi.mocked(deleteMediaForBlog)).not.toHaveBeenCalled();
    });

    it("calls deleteMediaForBlog with the correct ids when confirmed", async () => {
      const { user } = renderGallery({ isEditing: true });

      const deleteButton = await screen.findAllByRole("button", {
        name: "I18N_Delete_Media",
      });
      await user.click(deleteButton[0]);
      await user.click(screen.getByRole("button", { name: "I18N_Edit_Delete" }));

      await waitFor(() => {
        expect(vi.mocked(deleteMediaForBlog)).toHaveBeenCalledWith(1, 10);
      });
    });

    it("removes the deleted image from the gallery after confirmation", async () => {
      const { user } = renderGallery({ isEditing: true });

      await screen.findAllByRole("img");
      const deleteButtons = screen.getAllByRole("button", {
        name: "I18N_Delete_Media",
      });
      await user.click(deleteButtons[0]);
      await user.click(screen.getByRole("button", { name: "I18N_Edit_Delete" }));

      await waitFor(() => {
        expect(screen.getAllByRole("img")).toHaveLength(1);
      });
    });

    it("closes the dialog after a successful delete", async () => {
      const { user } = renderGallery({ isEditing: true });

      const deleteButton = await screen.findAllByRole("button", {
        name: "I18N_Delete_Media",
      });
      await user.click(deleteButton[0]);
      await user.click(screen.getByRole("button", { name: "I18N_Edit_Delete" }));

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("calls setMediaEdited after a successful delete", async () => {
      const setMediaEdited = vi.fn();
      const { user } = renderGallery({ isEditing: true, setMediaEdited });

      const deleteButton = await screen.findAllByRole("button", {
        name: "I18N_Delete_Media",
      });
      await user.click(deleteButton[0]);
      await user.click(screen.getByRole("button", { name: "I18N_Edit_Delete" }));

      await waitFor(() => {
        expect(setMediaEdited).toHaveBeenCalledWith(true);
      });
    });

    it("disables the confirm delete button while deleting", async () => {
      let resolveDelete!: () => void;
      vi.mocked(deleteMediaForBlog).mockReturnValue(
        new Promise<void>((resolve) => {
          resolveDelete = resolve;
        })
      );
      const { user } = renderGallery({ isEditing: true });

      const deleteButton = await screen.findAllByRole("button", {
        name: "I18N_Delete_Media",
      });
      await user.click(deleteButton[0]);
      await user.click(screen.getByRole("button", { name: "I18N_Edit_Delete" }));

      expect(screen.getByRole("button", { name: "I18N_Edit_Delete" })).toBeDisabled();

      resolveDelete();
    });
  });

  describe("upload functionality", () => {
    it("calls uploadMediaForBlog with the correct blog id and file", async () => {
      const { user } = renderGallery({ isEditing: true });

      await screen.findByRole("button", { name: "I18N_Upload_Media" });
      const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
      const input = document.querySelector<HTMLInputElement>("input[type='file']")!;
      await user.upload(input, file);

      await waitFor(() => {
        expect(vi.mocked(uploadMediaForBlog)).toHaveBeenCalledWith(1, file);
      });
    });

    it("appends the uploaded image to the gallery", async () => {
      const { user } = renderGallery({ isEditing: true });

      await screen.findAllByRole("img");
      const before = screen.getAllByRole("img").length;

      const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
      const input = document.querySelector<HTMLInputElement>("input[type='file']")!;
      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getAllByRole("img")).toHaveLength(before + 1);
      });
    });

    it("shows a delete button on the newly uploaded image", async () => {
      const { user } = renderGallery({ isEditing: true });

      await screen.findAllByRole("button", { name: "I18N_Delete_Media" });
      const before = screen.getAllByRole("button", {
        name: "I18N_Delete_Media",
      }).length;

      const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
      const input = document.querySelector<HTMLInputElement>("input[type='file']")!;
      await user.upload(input, file);

      await waitFor(() => {
        expect(
          screen.getAllByRole("button", { name: "I18N_Delete_Media" })
        ).toHaveLength(before + 1);
      });
    });

    it("calls setMediaEdited after a successful upload", async () => {
      const setMediaEdited = vi.fn();
      const { user } = renderGallery({ isEditing: true, setMediaEdited });

      await screen.findByRole("button", { name: "I18N_Upload_Media" });
      const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
      const input = document.querySelector<HTMLInputElement>("input[type='file']")!;
      await user.upload(input, file);

      await waitFor(() => {
        expect(setMediaEdited).toHaveBeenCalledWith(true);
      });
    });
  });
});
