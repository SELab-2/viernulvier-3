import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ThemeToggle } from "~/shared/components/ThemeToggle";
import { ThemeProvider } from "~/shared/components/ThemeContext";

describe("ThemeToggle", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
    document.cookie = "theme=; path=/; max-age=0";
  });

  it("toggles the document theme and persists the preference", async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.cookie).toContain("theme=dark");
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeTruthy();
  });

  it("renders the dark theme state from storage and toggles back to light", async () => {
    localStorage.setItem("theme", "dark");

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Switch to light mode" }));

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
    expect(document.cookie).toContain("theme=light");
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeTruthy();
  });
});
