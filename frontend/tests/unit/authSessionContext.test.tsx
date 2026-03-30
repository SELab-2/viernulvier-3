import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuthSessionProvider, useAuthSession } from "~/features/auth";
import * as loginServiceModule from "~/features/auth/services/loginService";
import * as tokenRefreshModule from "~/features/auth/services/tokenRefresh";
import { setupLocalStorage } from "tests/globalSetup";

setupLocalStorage();

describe("AuthSessionProvider", () => {
  it("throws when the hook is used outside the provider", () => {
    expect(() => renderHook(() => useAuthSession())).toThrow(
      "useAuthSession must be used within an AuthSessionProvider"
    );
  });

  it("bootstraps to anonymous when there is no stored session", async () => {
    vi.spyOn(loginServiceModule, "restoreSession").mockResolvedValue(null);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthSessionProvider>{children}</AuthSessionProvider>
    );

    const { result } = renderHook(() => useAuthSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.status).toBe("anonymous");
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("updates state after login", async () => {
    vi.spyOn(loginServiceModule, "restoreSession").mockResolvedValue(null);
    vi.spyOn(loginServiceModule, "login").mockResolvedValue({
      id: 1,
      username: "editor",
      isSuperUser: false,
      roles: ["editor"],
      permissions: ["events:update"],
      createdAt: "2026-03-30T10:00:00",
      lastLoginAt: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthSessionProvider>{children}</AuthSessionProvider>
    );

    const { result } = renderHook(() => useAuthSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.login({ username: "editor", password: "secret" });
    });

    await waitFor(() => {
      expect(result.current.status).toBe("authenticated");
    });

    expect(result.current.user?.username).toBe("editor");
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("clears the session when refresh fails", async () => {
    vi.spyOn(loginServiceModule, "restoreSession").mockResolvedValue({
      id: 1,
      username: "editor",
      isSuperUser: false,
      roles: ["editor"],
      permissions: [],
      createdAt: "2026-03-30T10:00:00",
      lastLoginAt: null,
    });
    vi.spyOn(tokenRefreshModule, "refreshAccessToken").mockRejectedValue(
      new Error("expired")
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthSessionProvider>{children}</AuthSessionProvider>
    );

    const { result } = renderHook(() => useAuthSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe("authenticated");
    });

    await act(async () => {
      await result.current.refreshSession();
    });

    await waitFor(() => {
      expect(result.current.status).toBe("anonymous");
    });

    expect(result.current.user).toBeNull();
  });
});
