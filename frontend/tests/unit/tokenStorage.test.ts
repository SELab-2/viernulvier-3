import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearStoredAuthTokens,
  getStoredAccessToken,
  getStoredAuthTokens,
  getStoredRefreshToken,
  hasStoredRefreshToken,
  hasStoredSession,
  storeAuthTokens,
  updateStoredAccessToken,
} from "~/features/auth/services/tokenStorage";

describe("tokenStorage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("reads stored access and refresh tokens", () => {
    localStorage.setItem("access_token", "access123");
    localStorage.setItem("refresh_token", "refresh123");

    expect(getStoredAccessToken()).toBe("access123");
    expect(getStoredRefreshToken()).toBe("refresh123");
    expect(getStoredAuthTokens()).toEqual({
      accessToken: "access123",
      refreshToken: "refresh123",
    });
    expect(hasStoredRefreshToken()).toBe(true);
    expect(hasStoredSession()).toBe(true);
  });

  it("reports no session when neither token exists", () => {
    expect(getStoredAuthTokens()).toEqual({
      accessToken: null,
      refreshToken: null,
    });
    expect(hasStoredRefreshToken()).toBe(false);
    expect(hasStoredSession()).toBe(false);
  });

  it("reports a session when only one token exists", () => {
    localStorage.setItem("refresh_token", "refresh123");
    expect(hasStoredSession()).toBe(true);

    localStorage.clear();
    localStorage.setItem("access_token", "access123");
    expect(hasStoredSession()).toBe(true);
  });

  it("stores, updates, and clears auth tokens", () => {
    storeAuthTokens({
      access_token: "access123",
      refresh_token: "refresh123",
      token_type: "bearer",
    });

    expect(localStorage.getItem("access_token")).toBe("access123");
    expect(localStorage.getItem("refresh_token")).toBe("refresh123");

    updateStoredAccessToken("access456");
    expect(localStorage.getItem("access_token")).toBe("access456");

    clearStoredAuthTokens();
    expect(localStorage.getItem("access_token")).toBe(null);
    expect(localStorage.getItem("refresh_token")).toBe(null);
  });

  it("safely returns null-like values when localStorage is unavailable", () => {
    vi.stubGlobal("localStorage", undefined);

    expect(getStoredAccessToken()).toBeNull();
    expect(getStoredRefreshToken()).toBeNull();
    expect(getStoredAuthTokens()).toEqual({
      accessToken: null,
      refreshToken: null,
    });
    expect(hasStoredRefreshToken()).toBe(false);
    expect(hasStoredSession()).toBe(false);

    expect(() => {
      storeAuthTokens({
        access_token: "access123",
        refresh_token: "refresh123",
        token_type: "bearer",
      });
      updateStoredAccessToken("access456");
      clearStoredAuthTokens();
    }).not.toThrow();
  });
});
