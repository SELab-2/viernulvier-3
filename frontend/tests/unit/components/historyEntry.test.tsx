import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HistoryEntry } from "~/features/history/components/historyEntry";
import { AuthSessionProvider } from "~/features/auth";
import * as loginServiceModule from "~/features/auth/services/loginService";

const baseUser = {
  id: 1,
  username: "editor",
  isSuperUser: false,
  roles: ["editor"],
  permissions: ["archive:update", "archive:delete"],
  createdAt: "2026-03-30T10:00:00",
  lastLoginAt: null,
};

const baseEntry = {
  entryYear: 2024,
  entryLanguage: "nl",
  year: 2024,
  language: "nl",
  title: "Important Event",
  description: "This is an important event in our history",
};

type HistoryEntryUpdateHandler = Parameters<typeof HistoryEntry>[0]["onUpdate"];
type HistoryEntryDeleteHandler = Parameters<typeof HistoryEntry>[0]["onDelete"];

function renderEntry(
  entry = baseEntry,
  onUpdate?: HistoryEntryUpdateHandler,
  onDelete?: HistoryEntryDeleteHandler,
  user = baseUser
) {
  vi.spyOn(loginServiceModule, "restoreSession").mockResolvedValue(user);

  return render(
    <AuthSessionProvider>
      <HistoryEntry {...entry} onUpdate={onUpdate} onDelete={onDelete} />
    </AuthSessionProvider>
  );
}

describe("HistoryEntry", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  describe("Display", () => {
    it("renders the year, title, and description", async () => {
      renderEntry();

      await waitFor(() => {
        expect(screen.getByText("2024")).toBeInTheDocument();
        expect(screen.getByText("Important Event")).toBeInTheDocument();
        expect(
          screen.getByText("This is an important event in our history")
        ).toBeInTheDocument();
      });
    });

    it("displays the year and title with a dash separator", async () => {
      renderEntry();

      await waitFor(() => {
        const heading = screen.getByRole("heading");
        expect(heading).toHaveTextContent("2024");
        expect(heading).toHaveTextContent("-");
        expect(heading).toHaveTextContent("Important Event");
      });
    });
  });

  describe("Edit Mode", () => {
    it("shows edit button when not editing", async () => {
      renderEntry();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /edit\.edit/i })).toBeInTheDocument();
      });
    });

    it("enters edit mode when edit button is clicked", async () => {
      const user = userEvent.setup();
      renderEntry();

      const editButton = await screen.findByRole("button", {
        name: /edit\.edit|pas aan/i,
      });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue("2024")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Important Event")).toBeInTheDocument();
        expect(
          screen.getByDisplayValue("This is an important event in our history")
        ).toBeInTheDocument();
      });
    });

    it("shows save and cancel buttons in edit mode", async () => {
      const user = userEvent.setup();
      renderEntry();

      const editButton = await screen.findByRole("button", {
        name: /edit\.edit|pas aan/i,
      });
      await user.click(editButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /edit\.save|opslaan/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /edit\.cancel/i })
        ).toBeInTheDocument();
      });
    });

    it("exits edit mode when cancel button is clicked", async () => {
      const user = userEvent.setup();
      renderEntry();

      const editButton = await screen.findByRole("button", {
        name: /edit\.edit|pas aan/i,
      });
      await user.click(editButton);

      const cancelButton = await screen.findByRole("button", {
        name: /edit\.cancel|annuleren/i,
      });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByDisplayValue("2024")).not.toBeInTheDocument();
      });
    });
  });

  describe("Update", () => {
    it("calls onUpdate with edited data when save is clicked", async () => {
      const user = userEvent.setup();
      const mockOnUpdate = vi.fn();
      renderEntry(baseEntry, mockOnUpdate);

      const editButton = await screen.findByRole("button", {
        name: /edit\.edit|pas aan/i,
      });
      await user.click(editButton);

      const titleInput = screen.getByDisplayValue("Important Event");
      await user.clear(titleInput);
      await user.type(titleInput, "Updated Event");

      const saveButton = screen.getByRole("button", { name: /edit\.save|opslaan/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith({
          entryYear: baseEntry.entryYear,
          entryLanguage: baseEntry.entryLanguage,
          year: 2024,
          language: "nl",
          title: "Updated Event",
          content: "This is an important event in our history",
        });
      });
    });

    it("exits edit mode after successful update", async () => {
      const user = userEvent.setup();
      const mockOnUpdate = vi.fn().mockResolvedValue(undefined);
      renderEntry(baseEntry, mockOnUpdate);

      const editButton = await screen.findByRole("button", {
        name: /edit\.edit|pas aan/i,
      });
      await user.click(editButton);

      const titleInput = screen.getByDisplayValue("Important Event");
      await user.clear(titleInput);
      await user.type(titleInput, "Updated Event");

      const saveButton = screen.getByRole("button", { name: /edit\.save|opslaan/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /edit\.edit|pas aan/i })
        ).toBeInTheDocument();
      });
    });

    it("allows editing year field", async () => {
      const user = userEvent.setup();
      const mockOnUpdate = vi.fn();
      renderEntry(baseEntry, mockOnUpdate);

      const editButton = await screen.findByRole("button", {
        name: /edit\.edit|pas aan/i,
      });
      await user.click(editButton);

      const yearInput = screen.getByDisplayValue("2024");
      await user.clear(yearInput);
      await user.type(yearInput, "2023");

      const saveButton = screen.getByRole("button", { name: /edit\.save|opslaan/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            year: 2023,
          })
        );
      });
    });

    it("allows editing content field", async () => {
      const user = userEvent.setup();
      const mockOnUpdate = vi.fn();
      renderEntry(baseEntry, mockOnUpdate);

      const editButton = await screen.findByRole("button", {
        name: /edit\.edit|pas aan/i,
      });
      await user.click(editButton);

      const contentInput = screen.getByDisplayValue(
        "This is an important event in our history"
      );
      await user.clear(contentInput);
      await user.type(contentInput, "New content");

      const saveButton = screen.getByRole("button", { name: /edit\.save|opslaan/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            content: "New content",
          })
        );
      });
    });
  });

  describe("Delete", () => {
    it("shows delete button", async () => {
      renderEntry();

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /history\.actions\.delete/i })
        ).toBeInTheDocument();
      });
    });

    it("calls onDelete when delete button is clicked and confirmed", async () => {
      const user = userEvent.setup();
      const mockOnDelete = vi.fn();
      renderEntry(baseEntry, undefined, mockOnDelete);

      const deleteButton = await screen.findByRole("button", {
        name: /history\.actions\.delete/i,
      });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith(baseEntry.year, baseEntry.language);
      });
    });

    it("does not call onDelete when delete confirmation is cancelled", async () => {
      const user = userEvent.setup();
      const mockOnDelete = vi.fn();
      vi.spyOn(window, "confirm").mockReturnValue(false);
      renderEntry(baseEntry, undefined, mockOnDelete);

      const deleteButton = await screen.findByRole("button", {
        name: /history\.actions\.delete|verwijder/i,
      });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockOnDelete).not.toHaveBeenCalled();
      });
    });
  });

  describe("Permissions", () => {
    it("does not show edit button for users without archive:update permission", async () => {
      const userWithoutPermission = {
        ...baseUser,
        permissions: ["archive:delete"],
      };
      renderEntry(baseEntry, undefined, undefined, userWithoutPermission);

      await waitFor(() => {
        expect(
          screen.queryByRole("button", { name: /edit\.edit/i })
        ).not.toBeInTheDocument();
      });
    });

    it("does not show delete button for users without archive:delete permission", async () => {
      const userWithoutPermission = {
        ...baseUser,
        permissions: ["archive:update"],
      };
      renderEntry(baseEntry, undefined, undefined, userWithoutPermission);

      await waitFor(() => {
        expect(
          screen.queryByRole("button", { name: /history\.actions\.delete/i })
        ).not.toBeInTheDocument();
      });
    });

    it("shows both buttons for users with both permissions", async () => {
      renderEntry();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /edit\.edit/i })).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /history\.actions\.delete/i })
        ).toBeInTheDocument();
      });
    });
  });
});
