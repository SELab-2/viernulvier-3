import { screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithRouterAndTheme } from "tests/utils/renderWithRouterAndTheme";

describe("History", async () => {
  beforeEach(async () => {
    renderWithRouterAndTheme({ useRealHistory: true });
    const user = userEvent.setup();
    const links = screen.getAllByRole("link", { name: "I18N_History" });
    await user.click(links[0]);
  });

  it("renders title and entries correctly", () => {
    expect(screen.getByText("I18N_History_Title")).toBeInTheDocument();
    expect(screen.getByText("I18N_History_Entry1_Title")).toBeInTheDocument();
    expect(screen.getByText("I18N_History_Entry1_Description")).toBeInTheDocument();
    expect(screen.getByText("I18N_History_Entry2_Title")).toBeInTheDocument();
    expect(screen.getByText("I18N_History_Entry2_Description")).toBeInTheDocument();
  });

  it("renders hero image", () => {
    const img = screen.getByTestId("history-hero");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/images/1914_Inhuldiging.jpg");
  });
});
