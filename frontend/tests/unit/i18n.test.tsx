import { describe, it, expect } from "vitest";
import i18n from "~/i18n";

describe("i18n configuration", () => {
  it("supports english and dutch", () => {
    expect(i18n.options.supportedLngs).toContain("en");
    expect(i18n.options.supportedLngs).toContain("nl");
  });

  it("falls back to english", () => {
    expect(i18n.options.fallbackLng).toStrictEqual(["en"]);
  });

  it("uses the correct backend load path", () => {
    expect(i18n.options.backend).toEqual({
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    });
  });

  it("disables interpolation escaping for React", () => {
    expect(i18n.options.interpolation?.escapeValue).toBe(false);
  });

  it("uses translation as the default namespace", () => {
    expect(i18n.options.defaultNS).toBe("translation");
  });
});
