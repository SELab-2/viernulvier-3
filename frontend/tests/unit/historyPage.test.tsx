import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthSessionProvider } from "~/features/auth";
import * as loginServiceModule from "~/features/auth/services/loginService";
import * as historyServiceModule from "~/features/history/services/historyService";
import HistoryPage from "~/features/history/pages/historyPage";

const baseUser = {
  id: 1,
  username: "editor",
  isSuperUser: false,
  roles: ["editor"],
  permissions: ["archive:create", "archive:update", "archive:delete"],
  createdAt: "2026-03-30T10:00:00",
  lastLoginAt: null,
};

const mockHistoryEntries = [
  {
    id_url: "http://localhost/api/v1/archive/history/1",
    year: 2024,
    language: "nl",
    title: "Recent Event",
    content: "A recent event",
  },
  {
    id_url: "http://localhost/api/v1/archive/history/2",
    year: 2020,
    language: "nl",
    title: "Past Event",
    content: "An event from the past",
  },
];

function renderPage(user = baseUser) {
  vi.spyOn(loginServiceModule, "restoreSession").mockResolvedValue(user);

  const router = createMemoryRouter(
    [
      {
        path: "/:lang/history",
        element: <HistoryPage />,
      },
    ],
    {
      initialEntries: ["/nl/history"],
    }
  );

  return render(
    <AuthSessionProvider>
      <RouterProvider router={router} />
    </AuthSessionProvider>
  );
}

describe("HistoryPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(window, "alert").mockImplementation(() => {}) as any;
  });

  describe("Loading State", () => {
    it("shows loading message while fetching entries", async () => {
      vi.spyOn(historyServiceModule, "getHistoryEntries").mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(mockHistoryEntries), 1000);
        });
      });

      renderPage();

      expect(screen.getByText("history.loading")).toBeInTheDocument();
    });

    it("hides loading message after entries are loaded", async () => {
      vi.spyOn(historyServiceModule, "getHistoryEntries").mockResolvedValue(mockHistoryEntries);

      renderPage();

      await waitFor(() => {
        expect(screen.queryByText("history.loading")).not.toBeInTheDocument();
      });
    });
  });

  describe("Display Entries", () => {
    it("renders all history entries after loading", async () => {
      vi.spyOn(historyServiceModule, "getHistoryEntries").mockResolvedValue(mockHistoryEntries);

      renderPage();

      await waitFor(() => {
        expect(screen.getByText("Recent Event")).toBeInTheDocument();
        expect(screen.getByText("Past Event")).toBeInTheDocument();
        expect(screen.getByText("A recent event")).toBeInTheDocument();
        expect(screen.getByText("An event from the past")).toBeInTheDocument();
      });
    });

    it("renders empty state when no entries exist", async () => {
      vi.spyOn(historyServiceModule, "getHistoryEntries").mockResolvedValue([]);

      renderPage();

      await waitFor(() => {
        expect(screen.getByText("history.empty.title")).toBeInTheDocument();
        expect(screen.getByText("history.empty.description")).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("shows error message when fetching entries fails", async () => {
      vi.spyOn(historyServiceModule, "getHistoryEntries").mockRejectedValue(
        new Error("Network error")
      );

      renderPage();

      await waitFor(() => {
        expect(screen.getByText("history.errorTitle")).toBeInTheDocument();
      });
    });

    it("shows error from server response", async () => {
      const errorMessage = "Backend temporarily unavailable";
      vi.spyOn(historyServiceModule, "getHistoryEntries").mockRejectedValue(
        new Error(errorMessage)
      );

      renderPage();

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it("shows alert when update fails", async () => {
      vi.spyOn(historyServiceModule, "getHistoryEntries").mockResolvedValue(mockHistoryEntries);
      vi.spyOn(historyServiceModule, "updateHistoryEntry").mockRejectedValue(
        new Error("Update failed")
      );

      renderPage();

      await waitFor(() => {
        expect(screen.getByText("Recent Event")).toBeInTheDocument();
      });

      const editButton = screen.getAllByRole("button", { name: /pas aan/i })[0];
      const user = userEvent.setup();
      await user.click(editButton);

      const saveButton = await screen.findByRole("button", { name: /opslaan/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining("Opslaan mislukt")
        );
      });
    });

    it("shows alert when delete fails", async () => {
      vi.spyOn(historyServiceModule, "getHistoryEntries").mockResolvedValue(mockHistoryEntries);
      vi.spyOn(historyServiceModule, "deleteHistoryEntry").mockRejectedValue(
        new Error("Delete failed")
      );
      vi.spyOn(window, "confirm").mockReturnValue(true);

      renderPage();

      await waitFor(() => {
        expect(screen.getByText("Recent Event")).toBeInTheDocument();
      });

      const deleteButton = screen.getAllByRole("button", { name: /verwijder/i })[0];
      const user = userEvent.setup();
      await user.click(deleteButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining("Verwijderen mislukt")
        );
      });
    });
  });

  describe("Create Entry", () => {
    it("shows create form when not creating", async () => {
      vi.spyOn(historyServiceModule, "getHistoryEntries").mockResolvedValue(mockHistoryEntries);

      renderPage();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /nieuwe entry/i })).toBeInTheDocument();
      });
    });

    it("shows form inputs when create button is clicked", async () => {
      vi.spyOn(historyServiceModule, "getHistoryEntries").mockResolvedValue(mockHistoryEntries);

      renderPage();

      const createButton = await screen.findByRole("button", { name: /nieuwe entry/i });
      const user = userEvent.setup();
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole("textbox", { name: /history\.form\.labels\.year/i })).toBeInTheDocument();
        expect(screen.getByRole("textbox", { name: /history\.form\.labels\.title/i })).toBeInTheDocument();
        expect(screen.getByRole("textbox", { name: /history\.form\.labels\.content/i })).toBeInTheDocument();
      });
    });

    it("creates a new entry when form is submitted", async () => {
      vi.spyOn(historyServiceModule, "getHistoryEntries").mockResolvedValue(mockHistoryEntries);
      const mockCreate = vi.spyOn(historyServiceModule, "createHistoryEntry").mockResolvedValue({
        id_url: "http://localhost/api/v1/archive/history/3",
        year: 2025,
        language: "nl",
        title: "New Event",
        content: "A new event",
      });

      renderPage();

      const createButton = await screen.findByRole("button", { name: /nieuwe entry/i });
      const user = userEvent.setup();
      await user.click(createButton);

      const titleInput = await screen.findByRole("textbox", {
        name: /history\.form\.labels\.title/i,
      });
      fireEvent.change(titleInput, { target: { value: "New Event" } });

      const contentInput = screen.getByRole("textbox", {
        name: /history\.form\.labels\.content/i,
      });
      fireEvent.change(contentInput, { target: { value: "A new event" } });

      const makeButton = screen.getByRole("button", { name: /maak aan/i });
      await user.click(makeButton);

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "New Event",
            content: "A new event",
          })
        );
      });
    });

    it("resets form after successful creation", async () => {
      vi.spyOn(historyServiceModule, "getHistoryEntries").mockResolvedValue(mockHistoryEntries);
      vi.spyOn(historyServiceModule, "createHistoryEntry").mockResolvedValue({
        id_url: "http://localhost/api/v1/archive/history/3",
        year: 2025,
        language: "nl",
        title: "New Event",
        content: "A new event",
      });

      renderPage();

      const createButton = await screen.findByRole("button", { name: /nieuwe entry/i });
      const user = userEvent.setup();
      await user.click(createButton);

      const titleInput = await screen.findByRole("textbox", {
        name: /history\.form\.labels\.title/i,
      });
      fireEvent.change(titleInput, { target: { value: "New Event" } });

      const makeButton = screen.getByRole("button", { name: /maak aan/i });
      await user.click(makeButton);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /nieuwe entry/i })).toBeInTheDocument();
        expect(
          screen.queryByRole("textbox", { name: /history\.form\.labels\.title/i })
        ).not.toBeInTheDocument();
      });
    });

    it("shows alert when create fails", async () => {
      vi.spyOn(historyServiceModule, "getHistoryEntries").mockResolvedValue(mockHistoryEntries);
      vi.spyOn(historyServiceModule, "createHistoryEntry").mockRejectedValue(
        new Error("Already exists")
      );

      renderPage();

      const createButton = await screen.findByRole("button", { name: /nieuwe entry/i });
      const user = userEvent.setup();
      await user.click(createButton);

      const makeButton = screen.getByRole("button", { name: /maak aan/i });
      await user.click(makeButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining("Aanmaken mislukt")
        );
      });
    });
  });

  describe("Permissions", () => {
    it("hides create form for users without archive:create permission", async () => {
      const userWithoutPermission = {
        ...baseUser,
        permissions: ["archive:update", "archive:delete"],
      };
      vi.spyOn(historyServiceModule, "getHistoryEntries").mockResolvedValue(mockHistoryEntries);

      renderPage(userWithoutPermission);

      await waitFor(() => {
        expect(screen.queryByRole("button", { name: /nieuwe entry/i })).not.toBeInTheDocument();
      });
    });

    it("shows entries but no create button for view-only users", async () => {
      const viewOnlyUser = {
        ...baseUser,
        permissions: [],
      };
      vi.spyOn(historyServiceModule, "getHistoryEntries").mockResolvedValue(mockHistoryEntries);

      renderPage(viewOnlyUser);

      await waitFor(() => {
        expect(screen.getByText("Recent Event")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /nieuwe entry/i })).not.toBeInTheDocument();
      });
    });
  });
});
