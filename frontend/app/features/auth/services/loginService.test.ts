import { describe, it, expect, beforeEach, vi } from "vitest";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { createApiClient } from "~/shared/services/apiClient";
import { login } from "./loginService";

describe("loginService", () => {
  let mockAdapter: AxiosMockAdapter;

  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
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
      expect(apiClient.defaults.headers.common["Authorization"]).toBe("Bearer access123");
    });

    it("throws when giving incorrect credentials", async () => {
      mockAdapter.onPost("/auth/login").reply(401);

      await expect(login({ username: "test", password: "wrong" })).rejects.toThrow();
    });
  });
});
