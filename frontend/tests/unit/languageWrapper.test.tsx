import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LanguageWrapper, { loader } from "~/shared/components/LanguageWrapper";

const mockChangeLanguage = vi.fn();
let mockLang: string | undefined = "en";
let mockI18nLanguage = "en";

vi.mock("react-router", () => ({
  useParams: () => ({ lang: mockLang }),
  Outlet: () => <div data-testid="outlet" />,
  redirect: (to: string) => ({ status: 302, headers: { Location: to } }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: {
      language: mockI18nLanguage,
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

type RedirectResult = { status: number; headers: { Location: string } };

function makeLoaderArgs(pathname: string, lang: string | undefined) {
  return {
    params: { lang },
    request: new Request(`http://localhost${pathname}`),
  } as Parameters<typeof loader>[0];
}

async function getRedirectResult(
  pathname: string,
  lang: string | undefined
): Promise<RedirectResult> {
  return loader(makeLoaderArgs(pathname, lang)) as unknown as RedirectResult;
}

describe("LanguageWrapper loader", () => {
  it("returns null for a supported language", async () => {
    const result = await loader(makeLoaderArgs("/en", "en"));
    expect(result).toBeNull();
  });

  it("returns null for nl", async () => {
    const result = await loader(makeLoaderArgs("/nl", "nl"));
    expect(result).toBeNull();
  });

  it("redirects to /en when lang is undefined", async () => {
    const result = await getRedirectResult("/undefined", undefined);
    expect(result.headers.Location).toBe("/en/undefined");
  });

  it("redirects /login to /en/login when lang is unsupported", async () => {
    const result = await getRedirectResult("/login", "login");
    expect(result.headers.Location).toBe("/en/login");
  });

  it("redirects /fr/home to /en/fr/home when lang is unsupported", async () => {
    const result = await getRedirectResult("/fr/home", "fr");
    expect(result.headers.Location).toBe("/en/fr/home");
  });
});

describe("LanguageWrapper component", () => {
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
