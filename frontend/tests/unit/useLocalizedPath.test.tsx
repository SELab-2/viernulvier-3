import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLocalizedPath } from "~/shared/hooks/useLocalizedPath";

let mockLang = "en";

vi.mock("react-router", () => ({
  useParams: () => ({ lang: mockLang }),
}));

describe("useLocalizedPath", () => {
  afterEach(() => {
    cleanup();
    mockLang = "en";
  });

  it("prefixes a path with the current language", () => {
    const { result } = renderHook(() => useLocalizedPath());
    expect(result.current("/archive")).toBe("/en/archive");
  });

  it("prefixes the root path correctly", () => {
    const { result } = renderHook(() => useLocalizedPath());
    expect(result.current("/")).toBe("/en/");
  });

  it("adds a leading slash when the path does not have one", () => {
    const { result } = renderHook(() => useLocalizedPath());
    expect(result.current("archive")).toBe("/en/archive");
  });

  it("uses the nl prefix when lang is nl", () => {
    mockLang = "nl";
    const { result } = renderHook(() => useLocalizedPath());
    expect(result.current("/archive")).toBe("/nl/archive");
  });

  it("handles nested paths", () => {
    const { result } = renderHook(() => useLocalizedPath());
    expect(result.current("/archive/detail")).toBe("/en/archive/detail");
  });
});
