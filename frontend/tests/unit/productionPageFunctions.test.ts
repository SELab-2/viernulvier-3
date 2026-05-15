import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  isEmptyHtml,
  getSanitizedHtmlOrUndefined,
  getTextOrDefault,
  useUnsavedChangesBlocker,
} from "~/features/archive/utils/productionPageFunctions";
import { renderHook } from "@testing-library/react";

vi.mock("dompurify", () => ({
  default: {
    sanitize: (input: string) => input,
  },
}));

vi.mock("react-router", () => ({
  useBlocker: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("isEmptyHtml", () => {
  it("gives true for empty string", () => {
    expect(isEmptyHtml("")).toBe(true);
  });

  it("gives true for only whitespace", () => {
    expect(isEmptyHtml("   ")).toBe(true);
  });

  it("gives true for <p><br></p>", () => {
    expect(isEmptyHtml("<p><br></p>")).toBe(true);
  });

  it("gives true for <p></p>", () => {
    expect(isEmptyHtml("<p></p>")).toBe(true);
  });

  it("gives true for for multiple empty paragraphs", () => {
    expect(isEmptyHtml("<p><br></p><p></p><p><br></p>")).toBe(true);
  });

  it("gives false for paragraph with text", () => {
    expect(isEmptyHtml("<p>Hallo wereld</p>")).toBe(false);
  });

  it("gives false for normal text", () => {
    expect(isEmptyHtml("gewone tekst")).toBe(false);
  });
});

describe("getSanitizedHtmlOrUndefined", () => {
  it("gives undefined for null", () => {
    expect(getSanitizedHtmlOrUndefined(null)).toBeUndefined();
  });

  it("gives undefined for undefined", () => {
    expect(getSanitizedHtmlOrUndefined(undefined)).toBeUndefined();
  });

  it("gives undefined for empty string", () => {
    expect(getSanitizedHtmlOrUndefined("")).toBeUndefined();
  });

  it("gives undefined for only whitespace", () => {
    expect(getSanitizedHtmlOrUndefined("   ")).toBeUndefined();
  });

  it("gives undefined for empty HTML (<p><br></p>)", () => {
    expect(getSanitizedHtmlOrUndefined("<p><br></p>")).toBeUndefined();
  });

  it("gives sanitized HTML for valid text", () => {
    const result = getSanitizedHtmlOrUndefined("<p>Hallo</p>");
    expect(result).toBe("<p>Hallo</p>");
  });

  it("trims whitespace", () => {
    const result = getSanitizedHtmlOrUndefined("  <p>Tekst</p>  ");
    expect(result).toBe("<p>Tekst</p>");
  });
});

describe("getTextOrDefault", () => {
  it("gives fallback for null", () => {
    expect(getTextOrDefault(null, "standaard")).toBe("standaard");
  });

  it("gives fallback for undefined", () => {
    expect(getTextOrDefault(undefined, "standaard")).toBe("standaard");
  });

  it("gives fallback for empty string", () => {
    expect(getTextOrDefault("", "standaard")).toBe("standaard");
  });

  it("gives fallback for only whitespace", () => {
    expect(getTextOrDefault("   ", "standaard")).toBe("standaard");
  });

  it("gives value if exists", () => {
    expect(getTextOrDefault("echte waarde", "standaard")).toBe("echte waarde");
  });

  it("trims value", () => {
    expect(getTextOrDefault("  hallo  ", "standaard")).toBe("hallo");
  });
});

describe("useUnsavedChangesBlocker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls blocker.proceed if user confirms", async () => {
    const proceed = vi.fn();
    const reset = vi.fn();
    const { useBlocker } = await import("react-router");

    vi.mocked(useBlocker).mockReturnValue({
      state: "blocked",
      proceed,
      reset,
      location: {
        pathname: "/test",
        search: "",
        hash: "",
        state: null,
        key: "default",
        unstable_mask: undefined,
      },
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const { rerender } = renderHook(() => useUnsavedChangesBlocker(true));
    rerender();

    expect(proceed).toHaveBeenCalled();
    expect(reset).toHaveBeenCalledTimes(0);
  });

  it("calls blocker.reset if user confirms", async () => {
    const proceed = vi.fn();
    const reset = vi.fn();
    const { useBlocker } = await import("react-router");

    vi.mocked(useBlocker).mockReturnValue({
      state: "blocked",
      proceed,
      reset,
      location: {
        pathname: "/test",
        search: "",
        hash: "",
        state: null,
        key: "default",
        unstable_mask: undefined,
      },
    });
    vi.spyOn(window, "confirm").mockReturnValue(false);

    const { rerender } = renderHook(() => useUnsavedChangesBlocker(true));
    rerender();

    expect(proceed).toHaveBeenCalledTimes(0);
    expect(reset).toHaveBeenCalled();
  });
});
