import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Navbar from "~/shared/components/Navbar";
import { MemoryRouter } from "react-router";
import { ThemeProvider } from "~/shared/components/ThemeContext";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "nav.home": "Home",
        "nav.archive": "Archive",
        "nav.history": "History",
      };
      return map[key] || key;
    },
  }),
}));

describe("Navbar", async () => {
  it("renders navigation links", () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <Navbar />
        </ThemeProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getAllByText("Archive").length === 2);
    expect(screen.getByText("History")).toBeDefined();
  });
});
