import { screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { renderWithRouterAndTheme } from "tests/utils/renderWithRouterAndTheme";

describe("NotFound", () => {
  beforeEach(() => {
    renderWithRouterAndTheme({
      useRealNotFound: true,
      initialPath: "/non-existent-route",
    });
  });

  it("renders the not found page with correct title and description", () => {
    expect(screen.getByText(`I18N_NotFound_Title`)).toBeInTheDocument();
    expect(screen.getByText("I18N_NotFound_Description")).toBeInTheDocument();
  });

  it("renders navigation buttons", () => {
    expect(
      screen.getByRole("link", { name: "I18N_NotFound_Button_Explore" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "I18N_NotFound_Button_History" })
    ).toBeInTheDocument();
  });
});
