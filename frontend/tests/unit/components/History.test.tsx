import { screen, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithRouterAndTheme } from "tests/utils/renderWithRouterAndTheme";
import * as historyServiceModule from "~/features/history/services/historyService";

describe("History", async () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.spyOn(historyServiceModule, "getHistoryEntries").mockResolvedValue([
      {
        id_url: "http://localhost/api/v1/archive/history/1",
        year: 2024,
        language: "en",
        title: "I18N_History_Entry1_Title",
        content: "I18N_History_Entry1_Description",
      },
      {
        id_url: "http://localhost/api/v1/archive/history/2",
        year: 2020,
        language: "en",
        title: "I18N_History_Entry2_Title",
        content: "I18N_History_Entry2_Description",
      },
    ]);

    renderWithRouterAndTheme({ useRealHistory: true, initialPath: "/history" });
  });

  it("renders title and entries correctly", async () => {
    expect(screen.getByText("I18N_History_Title")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("I18N_History_Entry1_Title")).toBeInTheDocument();
      expect(screen.getByText("I18N_History_Entry1_Description")).toBeInTheDocument();
      expect(screen.getByText("I18N_History_Entry2_Title")).toBeInTheDocument();
      expect(screen.getByText("I18N_History_Entry2_Description")).toBeInTheDocument();
    });
  });

  it("renders hero image", () => {
    const img = screen.getByTestId("history-hero");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/images/1914_Inhuldiging.jpg");
    expect(img).toHaveAttribute("alt", "I18N_History_Hero_Alt");
  });
});
