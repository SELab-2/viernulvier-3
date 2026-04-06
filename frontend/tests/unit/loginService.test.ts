import { describe, it, expect, beforeEach, vi } from "vitest";
import axios from "axios";
import * as envModule from "~/shared/utils/env";
import AxiosMockAdapter from "axios-mock-adapter";
import { createApiClient } from "~/shared/services/apiClient";

import {
  getCurrentUser,
  login,
  logout,
  refreshSession,
  refreshToken,
  restoreSession,
} from "~/features/auth/services/loginService";


describe("loginService", () => {
  let mockAdapter: AxiosMockAdapter;

  beforeEach(() => {
    vi.spyOn(envModule, "getEnv").mockReturnValue({
      API_BASE_URL: "http://localhost",
    });

    const apiClient = createApiClient();
    mockAdapter = new AxiosMockAdapter(apiClient);
    vi.spyOn(axios, "create").mockReturnValue(apiClient);
  });

  describe("login", () => {
    it("stores tokens and returns the authenticated user on success", async () => {
      mockAdapter.onPost("/api/v1/auth/login").reply(200, {
        access_token: "access123",
        refresh_token: "refresh123",
        token_type: "bearer",
      });
      mockAdapter.onGet("/api/v1/auth/users/me").reply(200, {
        id: 7,
        username: "test",
        super_user: false,
        roles: ["editor"],
        permissions: ["users:read"],
        created_at: "2026-03-30T10:00:00",
        last_login_at: null,
      });

      const user = await login({ username: "test", password: "test" });

      expect(localStorage.getItem("access_token")).toBe("access123");
      expect(localStorage.getItem("refresh_token")).toBe("refresh123");
      expect(user).toEqual({
        id: 7,
        username: "test",
        isSuperUser: false,
        roles: ["editor"],
        permissions: ["users:read"],
        createdAt: "2026-03-30T10:00:00",
        lastLoginAt: null,
      });
    });

    it("throws when giving incorrect credentials", async () => {
      mockAdapter.onPost("/api/v1/auth/login").reply(401);

      await expect(login({ username: "test", password: "wrong" })).rejects.toThrow();
    });

    it("does not mutate the active session when login credentials are rejected", async () => {
      localStorage.setItem("access_token", "active-access");
      localStorage.setItem("refresh_token", "active-refresh");

      mockAdapter.onPost("/api/v1/auth/login").reply(401);
      mockAdapter.onPost("/api/v1/auth/refresh").reply(200, {
        access_token: "new-access",
        token_type: "bearer",
      });

      await expect(login({ username: "test", password: "wrong" })).rejects.toThrow();

      expect(localStorage.getItem("access_token")).toBe("active-access");
      expect(localStorage.getItem("refresh_token")).toBe("active-refresh");
    });

    it("clears stored tokens if fetching the profile returns 401 after login", async () => {
      mockAdapter.onPost("/api/v1/auth/login").reply(200, {
        access_token: "access123",
        refresh_token: "refresh123",
        token_type: "bearer",
      });
      mockAdapter.onGet("/api/v1/auth/users/me").reply(401);
      mockAdapter.onPost("/api/v1/auth/refresh").reply(401);

      await expect(login({ username: "test", password: "test" })).rejects.toThrow(
        "Request failed with status code 401"
      );

      expect(localStorage.getItem("access_token")).toBe(null);
      expect(localStorage.getItem("refresh_token")).toBe(null);
    });
  });

  describe("getCurrentUser", () => {
    it("maps the backend user payload to the frontend session model", async () => {
      mockAdapter.onGet("/api/v1/auth/users/me").reply(200, {
        id: 2,
        username: "admin",
        super_user: true,
        roles: ["admin"],
        permissions: ["users:create"],
        created_at: "2026-01-01T00:00:00",
        last_login_at: "2026-03-30T00:00:00",
      });

      await expect(getCurrentUser()).resolves.toEqual({
        id: 2,
        username: "admin",
        isSuperUser: true,
        roles: ["admin"],
        permissions: ["users:create"],
        createdAt: "2026-01-01T00:00:00",
        lastLoginAt: "2026-03-30T00:00:00",
      });
    });
  });

  describe("refreshToken", () => {
    it("updates access token and Authorization header when refresh token exists", async () => {
      localStorage.setItem("refresh_token", "refresh123");

      mockAdapter.onPost("/api/v1/auth/refresh").reply(200, {
        access_token: "newAccess123",
        token_type: "bearer",
      });

      await expect(refreshToken()).resolves.toBe("newAccess123");

      expect(localStorage.getItem("access_token")).toBe("newAccess123");
    });

    it("uses the provided api client when present", async () => {
      localStorage.setItem("refresh_token", "refresh123");
      mockAdapter.onPost("/api/v1/auth/refresh").reply(200, {
        access_token: "newAccess123",
        token_type: "bearer",
      });

      const apiClient = createApiClient();

      await expect(refreshToken(apiClient)).resolves.toBe("newAccess123");

      expect(localStorage.getItem("access_token")).toBe("newAccess123");
    });

    it("throws if no refresh token exists", async () => {
      localStorage.clear();

      await expect(refreshToken()).rejects.toThrow("No refresh token available");
    });

    it("throws if refresh request fails", async () => {
      localStorage.setItem("refresh_token", "refresh123");

      mockAdapter.onPost("/api/v1/auth/refresh").reply(401);

      await expect(refreshToken()).rejects.toThrow(
        "Request failed with status code 401"
      );
      expect(localStorage.getItem("refresh_token")).toBe(null);
    });

    it("preserves stored tokens when refresh fails with a transient error", async () => {
      localStorage.setItem("access_token", "access123");
      localStorage.setItem("refresh_token", "refresh123");

      mockAdapter.onPost("/api/v1/auth/refresh").reply(500);

      await expect(refreshToken()).rejects.toThrow(
        "Request failed with status code 500"
      );

      expect(localStorage.getItem("access_token")).toBe("access123");
      expect(localStorage.getItem("refresh_token")).toBe("refresh123");
    });
  });

  describe("restoreSession", () => {
    it("returns null when there is no stored session", async () => {
      await expect(restoreSession()).resolves.toBeNull();
    });

    it("refreshes first when only a refresh token is available", async () => {
      localStorage.setItem("refresh_token", "refresh123");

      mockAdapter.onPost("/api/v1/auth/refresh").reply(200, {
        access_token: "newAccess123",
        token_type: "bearer",
      });
      mockAdapter.onGet("/api/v1/auth/users/me").reply(200, {
        id: 3,
        username: "restored",
        super_user: false,
        roles: [],
        permissions: [],
        created_at: "2026-01-01T00:00:00",
        last_login_at: null,
      });

      await expect(restoreSession()).resolves.toEqual({
        id: 3,
        username: "restored",
        isSuperUser: false,
        roles: [],
        permissions: [],
        createdAt: "2026-01-01T00:00:00",
        lastLoginAt: null,
      });
    });

    it("clears tokens and returns null when the stored session is invalid", async () => {
      localStorage.setItem("access_token", "expired");
      localStorage.setItem("refresh_token", "refresh123");
      mockAdapter.onGet("/api/v1/auth/users/me").reply(401);
      mockAdapter.onPost("/api/v1/auth/refresh").reply(401);

      await expect(restoreSession()).resolves.toBeNull();
      expect(localStorage.getItem("access_token")).toBe(null);
      expect(localStorage.getItem("refresh_token")).toBe(null);
    });

    it("rethrows non-401 errors while restoring a session", async () => {
      localStorage.setItem("access_token", "access123");
      mockAdapter.onGet("/api/v1/auth/users/me").reply(500);

      await expect(restoreSession()).rejects.toThrow(
        "Request failed with status code 500"
      );

      expect(localStorage.getItem("access_token")).toBe("access123");
    });
  });

  describe("logout", () => {
    it("removes the stored tokens", () => {
      localStorage.setItem("access_token", "access123");
      localStorage.setItem("refresh_token", "refresh123");

      logout();

      expect(localStorage.getItem("access_token")).toBe(null);
      expect(localStorage.getItem("refresh_token")).toBe(null);
    });
  });

  describe("refreshSession", () => {
    it("returns null and clears tokens when no refresh token exists", async () => {
      localStorage.setItem("access_token", "someToken");
      localStorage.removeItem("refresh_token");

      await expect(refreshSession()).resolves.toBeNull();

      expect(localStorage.getItem("access_token")).toBe(null);
      expect(localStorage.getItem("refresh_token")).toBe(null);
    });

    it("returns null and clears tokens when the refresh token is invalid", async () => {
      localStorage.setItem("access_token", "access123");
      localStorage.setItem("refresh_token", "refresh123");
      mockAdapter.onPost("/api/v1/auth/refresh").reply(401);

      await expect(refreshSession()).resolves.toBeNull();

      expect(localStorage.getItem("access_token")).toBe(null);
      expect(localStorage.getItem("refresh_token")).toBe(null);
    });

    it("calls getCurrentUser and returns the user after a successful refresh", async () => {
      localStorage.setItem("refresh_token", "refresh123");

      mockAdapter.onPost("/api/v1/auth/refresh").reply(200, {
        access_token: "newAccess123",
        token_type: "bearer",
      });
      mockAdapter.onGet("/api/v1/auth/users/me").reply(200, {
        id: 1,
        username: "test",
        super_user: false,
        roles: [],
        permissions: [],
        created_at: "2026-01-01T00:00:00",
        last_login_at: null,
      });

      await expect(refreshSession()).resolves.toEqual({
        id: 1,
        username: "test",
        isSuperUser: false,
        roles: [],
        permissions: [],
        createdAt: "2026-01-01T00:00:00",
        lastLoginAt: null,
      });

      expect(localStorage.getItem("access_token")).toBe("newAccess123");
    });

    it("rethrows transient refresh failures without clearing the session", async () => {
      localStorage.setItem("access_token", "access123");
      localStorage.setItem("refresh_token", "refresh123");
      mockAdapter.onPost("/api/v1/auth/refresh").reply(500);

      await expect(refreshSession()).rejects.toThrow(
        "Request failed with status code 500"
      );

      expect(localStorage.getItem("access_token")).toBe("access123");
      expect(localStorage.getItem("refresh_token")).toBe("refresh123");
    });
  });
});
