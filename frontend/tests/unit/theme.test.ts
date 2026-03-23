import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyTheme,
  getThemeBootstrapScript,
  readInitialTheme,
} from "~/shared/utils/theme";

function stubMatchMedia(matches: boolean) {
  const originalMatchMedia = window.matchMedia;
  const matchMediaMock = vi.fn(() => ({ matches } as MediaQueryList));

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: matchMediaMock,
  });

  return () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: originalMatchMedia,
    });
  };
}

describe("theme utils", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.colorScheme = "";
    document.cookie = "theme=; path=/; max-age=0";
  });

  it("returns light when window is unavailable", () => {
    vi.stubGlobal("window", undefined);

    try {
      expect(readInitialTheme()).toBe("light");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("treats a missing document as having no cookie theme", () => {
    const restoreMatchMedia = stubMatchMedia(true);
    vi.stubGlobal("document", undefined);

    try {
      expect(readInitialTheme()).toBe("dark");
    } finally {
      restoreMatchMedia();
      vi.unstubAllGlobals();
    }
  });

  it("prefers the stored theme from localStorage", () => {
    localStorage.setItem("theme", "dark");

    expect(readInitialTheme()).toBe("dark");
  });

  it("falls back to the cookie when storage access fails", () => {
    const getItemSpy = vi.spyOn(window.localStorage, "getItem");
    getItemSpy.mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    document.cookie = "theme=dark; path=/";

    try {
      expect(readInitialTheme()).toBe("dark");
    } finally {
      getItemSpy.mockRestore();
    }
  });

  it("uses matchMedia when there is no stored theme", () => {
    const restoreMatchMedia = stubMatchMedia(true);

    try {
      expect(readInitialTheme()).toBe("dark");
    } finally {
      restoreMatchMedia();
    }
  });

  it("returns light from matchMedia when dark mode is not preferred", () => {
    const restoreMatchMedia = stubMatchMedia(false);

    try {
      expect(readInitialTheme()).toBe("light");
    } finally {
      restoreMatchMedia();
    }
  });

  it("applies the theme to the document and persists it", () => {
    applyTheme("dark");

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.cookie).toContain("theme=dark");
  });

  it("skips applying the theme when document is unavailable", () => {
    vi.stubGlobal("document", undefined);

    try {
      expect(() => applyTheme("light")).not.toThrow();
      expect(localStorage.getItem("theme")).toBe(null);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("builds the bootstrap script", () => {
    const script = getThemeBootstrapScript();

    expect(script).toContain("localStorage.getItem");
    expect(script).toContain("prefers-color-scheme");
    expect(script).toContain("document.documentElement");
  });
});