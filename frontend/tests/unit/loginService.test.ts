import { describe, it, expect, beforeEach, vi } from "vitest";
import axios from "axios";
import * as envModule from "~/shared/utils/env";
import * as apiClientModule from "~/shared/services/apiClient";
import AxiosMockAdapter from "axios-mock-adapter";
import { createApiClient } from "~/shared/services/apiClient";
import { login, refreshToken } from "~/features/auth/services/loginService";
import { setupLocalStorage } from "tests/globalSetup";

setupLocalStorage();

describe("loginService", () => {
  let mockAdapter: AxiosMockAdapter;

  beforeEach(() => {
    vi.spyOn(envModule, "getEnv").mockReturnValue({
      API_URL: "http://localhost",
    });

    const apiClient = createApiClient();
    mockAdapter = new AxiosMockAdapter(apiClient);
    vi.spyOn(axios, "create").mockReturnValue(apiClient);
  });

  describe("login", () => {
    it("stores tokens and sets Authorization header on success", async () => {
      mockAdapter.onPost("/auth/login").reply(200, {
        access_token: "access123",
        refresh_token: "refresh123",
      });

      await login({ username: "test", password: "test" });

      expect(localStorage.getItem("access_token")).toBe("access123");
      expect(localStorage.getItem("refresh_token")).toBe("refresh123");

      const apiClient = createApiClient();
      expect(apiClient.defaults.headers.common["Authorization"]).toBe(
        "Bearer access123"
      );
    });

    it("throws when giving incorrect credentials", async () => {
      mockAdapter.onPost("/auth/login").reply(401);

      await expect(login({ username: "test", password: "wrong" })).rejects.toThrow();
    });
  });

  describe("refreshToken", () => {
    it("updates access token and Authorization header when refresh token exists", async () => {
      localStorage.setItem("refresh_token", "refresh123");

      mockAdapter.onPost("/auth/refresh").reply(200, {
        access_token: "newAccess123",
      });

      await refreshToken();

      expect(localStorage.getItem("access_token")).toBe("newAccess123");

      const apiClient = createApiClient();
      expect(apiClient.defaults.headers.common["Authorization"]).toBe(
        "Bearer newAccess123"
      );
    });

    it("does not create new apiClient when passing client", async () => {
      const createApiClientSpy = vi.spyOn(apiClientModule, "createApiClient");
      localStorage.setItem("refresh_token", "refresh123");
      mockAdapter.onPost("/auth/refresh").reply(200, {
        access_token: "newAccess123",
      });

      const apiClient = createApiClient();

      await refreshToken(apiClient);

      expect(createApiClientSpy).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem("access_token")).toBe("newAccess123");
      expect(apiClient.defaults.headers.common["Authorization"]).toBe(
        "Bearer newAccess123"
      );
    });

    it("does nothing if no refresh token exists", async () => {
      localStorage.clear();

      await refreshToken();

      expect(localStorage.getItem("access_token")).toBe(null);
    });

    it("throws if refresh request fails", async () => {
      localStorage.setItem("refresh_token", "refresh123");

      mockAdapter.onPost("/auth/refresh").reply(401);

      await expect(refreshToken()).rejects.toThrow(
        "Request failed with status code 401"
      );
    });
  });
});
