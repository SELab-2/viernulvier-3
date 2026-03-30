import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { AuthSessionProvider, useAuthSession } from "~/features/auth";
import * as loginServiceModule from "~/features/auth/services/loginService";
import * as tokenRefreshModule from "~/features/auth/services/tokenRefresh";
import { setupLocalStorage } from "tests/globalSetup";

setupLocalStorage();

describe("AuthSessionProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("throws when the hook is used outside the provider", () => {
    expect(() => renderHook(() => useAuthSession())).toThrow(
      "useAuthSession must be used within an AuthSessionProvider"
    );
  });

  it("bootstraps to an authenticated state when a session exists", async () => {
    vi.spyOn(loginServiceModule, "restoreSession").mockResolvedValue({
      id: 5,
      username: "manager",
      isSuperUser: false,
      roles: ["manager"],
      permissions: ["users:read"],
      createdAt: "2026-03-30T10:00:00",
      lastLoginAt: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthSessionProvider>{children}</AuthSessionProvider>
    );

    const { result } = renderHook(() => useAuthSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe("authenticated");
    });

    expect(result.current.user?.username).toBe("manager");
    expect(result.current.isAuthenticated).toBe(true);
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

  it("falls back to anonymous when bootstrap fails", async () => {
    vi.spyOn(loginServiceModule, "restoreSession").mockRejectedValue(
      new Error("bootstrap failed")
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthSessionProvider>{children}</AuthSessionProvider>
    );

    const { result } = renderHook(() => useAuthSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe("anonymous");
    });

    expect(result.current.user).toBeNull();
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

  it("logs out and clears the provider state", async () => {
    vi.spyOn(loginServiceModule, "restoreSession").mockResolvedValue({
      id: 1,
      username: "editor",
      isSuperUser: false,
      roles: ["editor"],
      permissions: [],
      createdAt: "2026-03-30T10:00:00",
      lastLoginAt: null,
    });
    const logoutSpy = vi.spyOn(loginServiceModule, "logout").mockImplementation(() => {
      localStorage.clear();
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthSessionProvider>{children}</AuthSessionProvider>
    );

    const { result } = renderHook(() => useAuthSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe("authenticated");
    });

    act(() => {
      result.current.logout();
    });

    expect(logoutSpy).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("anonymous");
    expect(result.current.user).toBeNull();
  });

  it("refreshes the session successfully", async () => {
    vi.spyOn(loginServiceModule, "restoreSession").mockResolvedValue(null);
    vi.spyOn(tokenRefreshModule, "refreshAccessToken").mockResolvedValue("fresh-token");
    vi.spyOn(loginServiceModule, "getCurrentUser").mockResolvedValue({
      id: 8,
      username: "admin",
      isSuperUser: true,
      roles: ["admin"],
      permissions: ["users:update"],
      createdAt: "2026-03-30T10:00:00",
      lastLoginAt: "2026-03-30T11:00:00",
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthSessionProvider>{children}</AuthSessionProvider>
    );

    const { result } = renderHook(() => useAuthSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe("anonymous");
    });

    await act(async () => {
      await result.current.refreshSession();
    });

    await waitFor(() => {
      expect(result.current.status).toBe("authenticated");
    });

    expect(result.current.user?.username).toBe("admin");
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

  it("re-runs bootstrap on auth storage changes and ignores unrelated keys", async () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const restoreSessionSpy = vi
      .spyOn(loginServiceModule, "restoreSession")
      .mockResolvedValue(null);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthSessionProvider>{children}</AuthSessionProvider>
    );

    const { unmount } = renderHook(() => useAuthSession(), { wrapper });

    await waitFor(() => {
      expect(restoreSessionSpy).toHaveBeenCalled();
    });

    restoreSessionSpy.mockClear();

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "theme",
          newValue: "dark",
        })
      );
    });

    expect(restoreSessionSpy).not.toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "access_token",
          newValue: "next-token",
        })
      );
    });

    await waitFor(() => {
      expect(restoreSessionSpy).toHaveBeenCalled();
    });

    restoreSessionSpy.mockClear();

    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });

    await waitFor(() => {
      expect(restoreSessionSpy).toHaveBeenCalled();
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith("storage", expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "storage",
      expect.any(Function)
    );
  });
});
