import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LanguageWrapper from "~/shared/components/LanguageWrapper";

const mockChangeLanguage = vi.fn();
let mockLang: string | undefined = "en";
let mockI18nLanguage = "en";

vi.mock("react-router", () => ({
  useParams: () => ({ lang: mockLang }),
  useTranslation: () => ({
    i18n: {
      language: mockI18nLanguage,
      changeLanguage: mockChangeLanguage,
    },
  }),
  Navigate: ({ to }: { to: string }) => {
    return <div data-testid="navigate" data-to={to} />;
  },
  Outlet: () => <div data-testid="outlet" />,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: {
      language: mockI18nLanguage,
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

describe("LanguageWrapper", () => {
  afterEach(() => {
    cleanup();
    mockChangeLanguage.mockReset();
  });

  beforeEach(() => {
    mockLang = "en";
    mockI18nLanguage = "en";
  });

  it("renders the Outlet for a supported language", () => {
    render(<LanguageWrapper />);
    expect(screen.getByTestId("outlet")).toBeTruthy();
  });

  it("renders the Outlet for nl", () => {
    mockLang = "nl";
    mockI18nLanguage = "nl";
    render(<LanguageWrapper />);
    expect(screen.getByTestId("outlet")).toBeTruthy();
  });

  it("redirects to /en when lang is undefined", () => {
    mockLang = undefined;
    render(<LanguageWrapper />);
    expect(screen.getByTestId("navigate").getAttribute("data-to")).toBe("/en");
  });

  it("redirects to /en when lang is unsupported", () => {
    mockLang = "fr";
    render(<LanguageWrapper />);
    expect(screen.getByTestId("navigate").getAttribute("data-to")).toBe("/en");
  });

  it("calls changeLanguage when i18n language differs from the url lang", () => {
    mockLang = "nl";
    mockI18nLanguage = "en";
    render(<LanguageWrapper />);
    expect(mockChangeLanguage).toHaveBeenCalledWith("nl");
  });

  it("does not call changeLanguage when i18n language matches the url lang", () => {
    mockLang = "en";
    mockI18nLanguage = "en";
    render(<LanguageWrapper />);
    expect(mockChangeLanguage).not.toHaveBeenCalled();
  });
});
