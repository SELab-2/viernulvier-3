import { screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { renderWithRouterAndTheme } from "tests/utils/renderWithRouterAndTheme";
import userEvent from "@testing-library/user-event";

describe("Navbar", () => {
  it("renders navigation links", () => {
    renderWithRouterAndTheme({});

    expect(screen.getByText("I18N_Home")).toBeInTheDocument();
    expect(screen.getByText("I18N_History")).toBeInTheDocument();
    // Once for the logo, once for the link
    expect(screen.getAllByText("I18N_Archive").length).toBe(2);
  });

  it("toggles mobile menu when clicking hamburger button", async () => {
    renderWithRouterAndTheme({});

    // After 2h I don't see why the tests have the Navbar rendered twice,
    // so let's just get this first one...
    const button = screen.getAllByTestId("hamburger-menu-button")[0];

    expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();

    await userEvent.click(button);

    expect(screen.queryByTestId("mobile-menu")).toBeInTheDocument();

    await userEvent.click(button);

    expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
  });

  it("renders navigation links when menu is opened", async () => {
    renderWithRouterAndTheme({});

    const button = screen.getAllByTestId("hamburger-menu-button")[0];

    // menu not present initially
    expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();

    await userEvent.click(button);

    // menu is rendered
    const menu = screen.getByTestId("mobile-menu");
    expect(menu).toBeInTheDocument();

    // now query inside the menu
    expect(within(menu).getByText("I18N_Home")).toBeInTheDocument();
    expect(within(menu).getByText("I18N_Archive")).toBeInTheDocument();
    expect(within(menu).getByText("I18N_History")).toBeInTheDocument();
    await userEvent.click(button);
  });

  it("navigates to home page when clicking Home link", async () => {
    // For this we override the routes defined
    renderWithRouterAndTheme({});

    const user = userEvent.setup();
    const links = screen.getAllByRole("link", { name: "I18N_Home" });
    await user.click(links[0]);
    expect(screen.getAllByText("TEST_HOME_PAGE").length).toBeGreaterThanOrEqual(1);
  });

  it("navigates to archive page when clicking Archive link", async () => {
    // For this we override the routes defined
    renderWithRouterAndTheme({});

    const user = userEvent.setup();
    const links = screen.getAllByRole("link", { name: "I18N_Archive" });
    await user.click(links[0]);
    expect(screen.getByText("TEST_ARCHIVE_PAGE")).toBeInTheDocument();
  });

  it("navigates to history page when clicking History link", async () => {
    // For this we override the routes defined
    renderWithRouterAndTheme({});

    const user = userEvent.setup();
    const links = screen.getAllByRole("link", { name: "I18N_History" });
    await user.click(links[0]);
    expect(screen.getByText("TEST_HISTORY_PAGE")).toBeInTheDocument();
  });

  it("mobile - navigates to home page when clicking Home link", async () => {
    // For this we override the routes defined
    renderWithRouterAndTheme({});

    const button = screen.getAllByTestId("hamburger-menu-button")[0];
    await userEvent.click(button);
    const menu = screen.getByTestId("mobile-menu");

    const user = userEvent.setup();
    const link = within(menu).getByRole("link", { name: "I18N_Home" });
    await user.click(link);
    expect(screen.getAllByText("TEST_HOME_PAGE").length).toBeGreaterThanOrEqual(1);
  });

  it("mobile - navigates to archive page when clicking Archive link", async () => {
    // For this we override the routes defined
    renderWithRouterAndTheme({});

    const button = screen.getAllByTestId("hamburger-menu-button")[0];
    await userEvent.click(button);
    const menu = screen.getByTestId("mobile-menu");

    const user = userEvent.setup();
    const links = within(menu).getAllByRole("link", { name: "I18N_Archive" });
    await user.click(links[0]);
    expect(screen.getByText("TEST_ARCHIVE_PAGE")).toBeInTheDocument();
  });

  it("mobile - navigates to history page when clicking History link", async () => {
    // For this we override the routes defined
    renderWithRouterAndTheme({});

    const button = screen.getAllByTestId("hamburger-menu-button")[0];
    await userEvent.click(button);
    const menu = screen.getByTestId("mobile-menu");

    const user = userEvent.setup();
    const links = within(menu).getAllByRole("link", { name: "I18N_History" });
    await user.click(links[0]);
    expect(screen.getByText("TEST_HISTORY_PAGE")).toBeInTheDocument();
  });
});
