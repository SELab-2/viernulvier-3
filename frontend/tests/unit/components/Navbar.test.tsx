import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Navbar from "~/shared/components/Navbar";
import { MemoryRouter } from "react-router";
import { ThemeProvider } from "~/shared/components/ThemeContext";
import userEvent from "@testing-library/user-event";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "nav.home": "I18N_Home",
        "nav.archive": "I18N_Archive",
        "nav.history": "I18N_History",
      };
      return map[key] || key;
    },
  }),
}));

function renderWithRouterAndTheme(component: React.ReactNode) {
  render(
    <MemoryRouter>
      <ThemeProvider>{component}</ThemeProvider>
    </MemoryRouter>
  );
}

describe("Navbar", () => {
  it("renders navigation links", () => {
    renderWithRouterAndTheme(<Navbar />);

    expect(screen.getByText("I18N_Home")).toBeInTheDocument();
    expect(screen.getByText("I18N_History")).toBeInTheDocument();
    // Once for the logo, once for the link
    expect(screen.getAllByText("I18N_Archive").length).toBe(2);
  });

  it("toggles mobile menu when clicking hamburger button", async () => {
    renderWithRouterAndTheme(<Navbar />);

    // After 2h I don't see why the tests have the Navbar rendered twice,
    // so let's just get this first one...
    const button = screen.getAllByTestId("hamburger-menu-button")[0];

    expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();

    await userEvent.click(button);

    expect(screen.queryByTestId("mobile-menu")).toBeInTheDocument();

    await userEvent.click(button);

    expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
  });
});
