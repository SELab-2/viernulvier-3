import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductionPageMediaGallery } from "~/features/archive/components/ProductionPageMediaGallery";
import type { MediaList } from "~/features/archive/types/mediaTypes";
import {
  deleteMedia,
  getMediaForProduction,
  uploadMedia,
} from "~/features/archive/services/mediaService";

vi.mock("~/features/archive/services/mediaService", () => ({
  getMediaForProduction: vi.fn(),
  deleteMedia: vi.fn(),
  uploadMedia: vi.fn(),
}));

const PRODUCTION_ID_URL = "http://localhost/api/v1/productions/1";

const baseMediaResponse: MediaList = {
  media: [
    {
      id_url: "http://localhost/api/v1/productions/1/media/10",
      url: "https://example.com/image1.jpg",
      production_id_url: PRODUCTION_ID_URL,
      blog_id_url: null,
      content_type: "image/jpeg",
      uploaded_at: "2026-03-29T14:00:00",
    },
    {
      id_url: "http://localhost/api/v1/productions/1/media/11",
      url: "https://example.com/image2.jpg",
      production_id_url: PRODUCTION_ID_URL,
      blog_id_url: null,
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
  title: "Test Production",
  production_id_url: PRODUCTION_ID_URL,
  setMediaEdited: vi.fn(),
};

function renderGallery(props: Partial<typeof baseProps & { isEditing: boolean }> = {}) {
  return {
    user: userEvent.setup(),
    ...render(<ProductionPageMediaGallery {...baseProps} isEditing={false} {...props} />),
  };
}

describe("ProductionPageMediaGallery", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(getMediaForProduction).mockResolvedValue(baseMediaResponse);
    vi.mocked(deleteMedia).mockResolvedValue(undefined);
    vi.mocked(uploadMedia).mockResolvedValue({
      id_url: "http://localhost/api/v1/productions/1/media/99",
      url: "https://example.com/uploaded.jpg",
      content_type: "image/jpeg",
      production_id_url: PRODUCTION_ID_URL,
      blog_id_url: null,
      uploaded_at: "2026-03-29T14:00:00",
    });
  });

  describe("view mode (isEditing: false)", () => {
    it("fetches media from the service", () => {
      renderGallery({ isEditing: false });

      expect(vi.mocked(getMediaForProduction)).toHaveBeenCalled();
    });

    it("does not render the upload button", () => {
      renderGallery({ isEditing: false });

      expect(
        screen.queryByRole("button", { name: "productionPage.uploadMedia" })
      ).not.toBeInTheDocument();
    });

    it("does not render delete buttons on images", () => {
      renderGallery({ isEditing: false });

      expect(
        screen.queryByRole("button", { name: "productionPage.deleteMedia" })
      ).not.toBeInTheDocument();
    });

    it("images are still clickable to open the lightbox", async () => {
      const { user } = renderGallery({ isEditing: false });

      const images = await screen.findAllByRole("img");
      await user.click(images[0]);

      expect(
        screen.getByRole("button", { name: "productionPage.closeLightbox" })
      ).toBeInTheDocument();
    });
  });

  describe("edit mode (isEditing: true)", () => {
    it("fetches media from the service on mount", async () => {
      renderGallery({ isEditing: true });

      await waitFor(() => {
        expect(vi.mocked(getMediaForProduction)).toHaveBeenCalledWith(
          1,
          expect.any(Object)
        );
      });
    });

    it("renders the upload button", async () => {
      renderGallery({ isEditing: true });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "productionPage.uploadMedia" })
        ).toBeInTheDocument();
      });
    });

    it("renders a delete button on each fetched media image", async () => {
      renderGallery({ isEditing: true });

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole("button", {
          name: "productionPage.deleteMedia",
        });
        expect(deleteButtons).toHaveLength(2);
      });
    });

    it("shows the no-media message when fetch returns no images", async () => {
      vi.mocked(getMediaForProduction).mockResolvedValue({
        media: [],
        pagination: { has_more: false, next_cursor: undefined, total_count: 0 },
      });

      renderGallery({ isEditing: true });

      expect(await screen.findByText("productionPage.noImagesYet")).toBeInTheDocument();
    });

    it("shows the no-media message when the fetch fails", async () => {
      vi.mocked(getMediaForProduction).mockRejectedValue(new Error("Network error"));

      renderGallery({ isEditing: true });

      expect(await screen.findByText("productionPage.noImagesYet")).toBeInTheDocument();
    });

    it("does not render the no-media message when images are present", async () => {
      renderGallery({ isEditing: true });

      await screen.findAllByRole("img");

      expect(screen.queryByText("productionPage.noImagesYet")).not.toBeInTheDocument();
    });
  });

  describe("delete functionality", () => {
    it("opens a confirmation dialog when the delete button is clicked", async () => {
      const { user } = renderGallery({ isEditing: true });

      const deleteButtons = await screen.findAllByRole("button", {
        name: "productionPage.deleteMedia",
      });
      await user.click(deleteButtons[0]);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("productionPage.edit.confirmDeleteTitle")).toBeInTheDocument();
      expect(screen.getByText("productionPage.edit.confirmDeleteBody")).toBeInTheDocument();
    });

    it("closes the dialog without deleting when cancel is clicked", async () => {
      const { user } = renderGallery({ isEditing: true });

      const deleteButtons = await screen.findAllByRole("button", {
        name: "productionPage.deleteMedia",
      });
      await user.click(deleteButtons[0]);
      await user.click(screen.getByRole("button", { name: "I18N_ProductionPage_Edit_Cancel" }));

      expect(screen.queryByText("productionPage.edit.confirmDeleteTitle")).not.toBeInTheDocument();
      expect(vi.mocked(deleteMedia)).not.toHaveBeenCalled();
    });

    it("calls deleteMedia with the correct ids when confirmed", async () => {
      const { user } = renderGallery({ isEditing: true });

      const deleteButtons = await screen.findAllByRole("button", {
        name: "productionPage.deleteMedia",
      });
      await user.click(deleteButtons[0]);
      await user.click(screen.getByRole("button", { name: "productionPage.edit.delete" }));

      await waitFor(() => {
        expect(vi.mocked(deleteMedia)).toHaveBeenCalledWith(1, 10);
      });
    });

    it("removes the deleted image from the gallery after confirmation", async () => {
      const { user } = renderGallery({ isEditing: true });

      await screen.findAllByRole("img");
      const deleteButtons = screen.getAllByRole("button", {
        name: "productionPage.deleteMedia",
      });
      await user.click(deleteButtons[0]);
      await user.click(screen.getByRole("button", { name: "productionPage.edit.delete" }));

      await waitFor(() => {
        expect(screen.getAllByRole("img")).toHaveLength(1);
      });
    });

    it("closes the dialog after a successful delete", async () => {
      const { user } = renderGallery({ isEditing: true });

      const deleteButtons = await screen.findAllByRole("button", {
        name: "productionPage.deleteMedia",
      });
      await user.click(deleteButtons[0]);
      await user.click(screen.getByRole("button", { name: "productionPage.edit.delete" }));

      await waitFor(() => {
        expect(screen.queryByText("productionPage.edit.confirmDeleteTitle")).not.toBeInTheDocument();
      });
    });

    it("calls setMediaEdited after a successful delete", async () => {
      const setMediaEdited = vi.fn();
      const { user } = renderGallery({ isEditing: true, setMediaEdited });

      const deleteButtons = await screen.findAllByRole("button", {
        name: "productionPage.deleteMedia",
      });
      await user.click(deleteButtons[0]);
      await user.click(screen.getByRole("button", { name: "productionPage.edit.delete" }));

      await waitFor(() => {
        expect(setMediaEdited).toHaveBeenCalledWith(true);
      });
    });

    it("disables the confirm delete button while deleting", async () => {
      let resolveDelete!: () => void;
      vi.mocked(deleteMedia).mockReturnValue(
        new Promise<void>((resolve) => {
          resolveDelete = resolve;
        })
      );
      const { user } = renderGallery({ isEditing: true });

      const deleteButtons = await screen.findAllByRole("button", {
        name: "productionPage.deleteMedia",
      });
      await user.click(deleteButtons[0]);
      await user.click(screen.getByRole("button", { name: "productionPage.edit.delete" }));

      expect(screen.getByRole("button", { name: "productionPage.edit.delete" })).toBeDisabled();

      resolveDelete();
    });

    it("shows the no-media message after the last image is deleted", async () => {
      vi.mocked(getMediaForProduction).mockResolvedValue({
        media: [baseMediaResponse.media[0]!],
        pagination: { has_more: false, next_cursor: undefined, total_count: 1 },
      });

      const { user } = renderGallery({ isEditing: true });

      const deleteButtons = await screen.findAllByRole("button", {
        name: "productionPage.deleteMedia",
      });
      await user.click(deleteButtons[0]);
      await user.click(screen.getByRole("button", { name: "productionPage.edit.delete" }));

      expect(await screen.findByText("productionPage.noImagesYet")).toBeInTheDocument();
    });
  });

  describe("upload functionality", () => {
    it("calls uploadMedia with the correct production id and file", async () => {
      const { user } = renderGallery({ isEditing: true });

      await screen.findByRole("button", { name: "productionPage.uploadMedia" });
      const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
      const input = document.querySelector<HTMLInputElement>("input[type='file']")!;
      await user.upload(input, file);

      await waitFor(() => {
        expect(vi.mocked(uploadMedia)).toHaveBeenCalledWith(1, file);
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

      await screen.findAllByRole("button", { name: "productionPage.deleteMedia" });
      const before = screen.getAllByRole("button", {
        name: "productionPage.deleteMedia",
      }).length;

      const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
      const input = document.querySelector<HTMLInputElement>("input[type='file']")!;
      await user.upload(input, file);

      await waitFor(() => {
        expect(
          screen.getAllByRole("button", { name: "productionPage.deleteMedia" })
        ).toHaveLength(before + 1);
      });
    });

    it("calls setMediaEdited after a successful upload", async () => {
      const setMediaEdited = vi.fn();
      const { user } = renderGallery({ isEditing: true, setMediaEdited });

      await screen.findByRole("button", { name: "productionPage.uploadMedia" });
      const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
      const input = document.querySelector<HTMLInputElement>("input[type='file']")!;
      await user.upload(input, file);

      await waitFor(() => {
        expect(setMediaEdited).toHaveBeenCalledWith(true);
      });
    });
  });

  describe("lightbox", () => {
    it("opens the lightbox when an image is clicked", async () => {
      const { user } = renderGallery({ isEditing: true });

      const images = await screen.findAllByRole("img");
      await user.click(images[0]);

      expect(
        screen.getByRole("button", { name: "productionPage.closeLightbox" })
      ).toBeInTheDocument();
      expect(screen.getByAltText("productionPage.archivePhoto")).toHaveAttribute(
        "src",
        "https://example.com/image1.jpg"
      );
    });

    it("closes the lightbox when the close button is clicked", async () => {
      const { user } = renderGallery({ isEditing: true });

      const images = await screen.findAllByRole("img");
      await user.click(images[0]);
      await user.click(screen.getByRole("button", { name: "productionPage.closeLightbox" }));

      expect(
        screen.queryByRole("button", { name: "productionPage.closeLightbox" })
      ).not.toBeInTheDocument();
    });

    it("closes the lightbox when the backdrop is clicked", async () => {
      const { user } = renderGallery({ isEditing: true });

      const images = await screen.findAllByRole("img");
      await user.click(images[0]);

      const dialog = screen.getByRole("dialog");
      await user.click(dialog);

      expect(
        screen.queryByRole("button", { name: "productionPage.closeLightbox" })
      ).not.toBeInTheDocument();
    });

    it("closes the lightbox when escape is pressed", async () => {
      const { user } = renderGallery({ isEditing: true });

      const images = await screen.findAllByRole("img");
      await user.click(images[0]);
      await user.keyboard("{Escape}");

      expect(
        screen.queryByRole("button", { name: "productionPage.closeLightbox" })
      ).not.toBeInTheDocument();
    });

    it("shows the correct image when a second image is clicked", async () => {
      const { user } = renderGallery({ isEditing: true });

      const images = await screen.findAllByRole("img");
      await user.click(images[1]);

      expect(screen.getByAltText("productionPage.archivePhoto")).toHaveAttribute(
        "src",
        "https://example.com/image2.jpg"
      );
    });

    it("closes the lightbox when the open image is deleted", async () => {
      const { user } = renderGallery({ isEditing: true });

      const images = await screen.findAllByRole("img");
      await user.click(images[0]);

      // delete from within the lightbox (or gallery card — either triggers same flow)
      const deleteButtons = screen.getAllByRole("button", { name: "productionPage.deleteMedia" });
      await user.click(deleteButtons[0]);
      await user.click(screen.getByRole("button", { name: "productionPage.edit.delete" }));

      await waitFor(() => {
        expect(
          screen.queryByRole("button", { name: "productionPage.closeLightbox" })
        ).not.toBeInTheDocument();
      });
    });
  });
});
