import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LanguageSwitcher from "~/shared/components/LanguageSwitcher";

const mockNavigate = vi.fn();
let mockPathname = "/en/archive";
let mockLang = "en";

vi.mock("react-router", () => ({
  useParams: () => ({ lang: mockLang }),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname }),
}));

describe("LanguageSwitcher", () => {
  afterEach(() => {
    cleanup();
    mockNavigate.mockReset();
  });

  beforeEach(() => {
    mockPathname = "/en/archive";
    mockLang = "en";
  });

  it("renders both language buttons", () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText("EN")).toBeTruthy();
    expect(screen.getByText("NL")).toBeTruthy();
  });

  it("highlights the active language when lang is en", () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText("EN").className).toContain("bg-archive-ink");
    expect(screen.getByText("NL").className).toContain("opacity-50");
  });

  it("highlights the active language when lang is nl", () => {
    mockLang = "nl";
    mockPathname = "/nl/archive";
    render(<LanguageSwitcher />);
    expect(screen.getByText("NL").className).toContain("bg-archive-ink");
    expect(screen.getByText("EN").className).toContain("opacity-50");
  });

  it("toggles from en to nl when clicking the active EN button", () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByText("EN"));
    expect(mockNavigate).toHaveBeenCalledWith("/nl/archive");
  });

  it("toggles from en to nl when clicking the inactive NL button", () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByText("NL"));
    expect(mockNavigate).toHaveBeenCalledWith("/nl/archive");
  });

  it("toggles from nl to en when clicking the active NL button", () => {
    mockLang = "nl";
    mockPathname = "/nl/archive";
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByText("NL"));
    expect(mockNavigate).toHaveBeenCalledWith("/en/archive");
  });

  it("toggles from nl to en when clicking the inactive EN button", () => {
    mockLang = "nl";
    mockPathname = "/nl/archive";
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByText("EN"));
    expect(mockNavigate).toHaveBeenCalledWith("/en/archive");
  });

  it("preserves the path beyond the lang segment when toggling", () => {
    mockPathname = "/en/history";
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByText("NL"));
    expect(mockNavigate).toHaveBeenCalledWith("/nl/history");
  });

  it("works on the root lang path with no trailing segment", () => {
    mockPathname = "/en";
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByText("NL"));
    expect(mockNavigate).toHaveBeenCalledWith("/nl");
  });

  it("only calls navigate once per click", () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByText("NL"));
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });
});
