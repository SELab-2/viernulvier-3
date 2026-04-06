import { screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithRouterAndTheme } from "tests/utils/renderWithRouterAndTheme";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "home.title": "I18N_Title",
        "home.description": "I18N_Description",
        "home.stats.productions": "I18N_Home_Stats_Productions",
        "home.stats.events": "I18N_Home_Stats_Events",
        "home.stats.artists": "I18N_Home_Stats_Artists",
        "home.stats.genres": "I18N_Home_Stats_Genres",
        "home.buttons.explore": "I18N_Home_Button_Explore",
        "home.buttons.history": "I18N_Home_Button_History",
        "archive.title": "I18N_Archive_Title",
        "history.title": "I18N_History_Title",
      };
      return map[key] || key;
    },
  }),
}));

describe("Home", () => {
  it("renders title and description correctly", () => {
    renderWithRouterAndTheme();
    expect(screen.getByText("I18N_Title")).toBeInTheDocument();
    expect(screen.getByText("I18N_Description")).toBeInTheDocument();
  });

  it("renders statistics with correct labels and counts", () => {
    renderWithRouterAndTheme();
    expect(screen.getByText("I18N_Home_Stats_Productions")).toBeInTheDocument();
    expect(screen.getByText("I18N_Home_Stats_Events")).toBeInTheDocument();
    expect(screen.getByText("I18N_Home_Stats_Artists")).toBeInTheDocument();
    expect(screen.getByText("I18N_Home_Stats_Genres")).toBeInTheDocument();
  });

  it("renders buttons with correct labels and links", () => {
    renderWithRouterAndTheme();
    expect(
      screen.getByRole("link", { name: "I18N_Home_Button_Explore" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "I18N_Home_Button_History" })
    ).toBeInTheDocument();
  });

  it("explorebutton navigates to archive page", async () => {
    const user = userEvent.setup();
    renderWithRouterAndTheme();
    const exploreButton = screen.getByTestId("home-button-I18N_Home_Button_Explore");

    expect(exploreButton).toHaveAttribute("href", "/nl/archive");
    await user.click(exploreButton!);
    expect(screen.getByText("I18N_Archive_Title")).toBeInTheDocument();
  });

  it("historybutton navigates to history page", async () => {
    const user = userEvent.setup();
    renderWithRouterAndTheme();
    const historyButton = screen.getByTestId("home-button-I18N_Home_Button_History");

    expect(historyButton).toHaveAttribute("href", "/nl/history");
    await user.click(historyButton!);
    expect(screen.getByText("I18N_History_Title")).toBeInTheDocument();
  });
});
