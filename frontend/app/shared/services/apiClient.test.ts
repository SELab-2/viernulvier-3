import { describe, it, expect, vi, beforeEach } from "vitest";
import axios, { type AxiosInstance } from "axios";
import { createApiClient, getByUrl } from "./apiClient";
import * as envModule from "~/shared/utils/env";

vi.mock("axios");

describe("createApiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(envModule, "getEnv").mockReturnValue({
      API_BASE_URL: "http://localhost",
    });

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
  });

  it("creates axios instance with correct config", () => {
    const mockCreate = vi.spyOn(axios, "create").mockReturnValue({} as AxiosInstance);

    createApiClient();

    expect(mockCreate).toHaveBeenCalledWith({
      baseURL: expect.any(String),
      timeout: 1000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  });

  it("adds Authorization header if token exists", () => {
    localStorage.setItem("access_token", "test_token1234");

    const mockInstance = {
      defaults: { headers: { common: {} } },
    } as AxiosInstance;

    vi.spyOn(axios, "create").mockReturnValue(mockInstance);

    const client = createApiClient();

    expect(client.defaults.headers.common["Authorization"]).toBe("Bearer test_token1234");
  });

  it("returns response data on GET request", async () => {
    const mockGet = vi.fn().mockResolvedValue({ data: { foo: "bar" } });

    vi.spyOn(axios, "create").mockReturnValue({
      get: mockGet,
    } as unknown as AxiosInstance);

    const client = createApiClient();
    const result = await client.get("/test");
    expect(mockGet).toHaveBeenCalledWith("/test");
    expect(result).toEqual({ data: { foo: "bar" } });
  });
});

describe("getByUrl", () => {
  it("returns response data", async () => {
    const mockGet = vi.fn().mockResolvedValue({ data: { foo: "bar" } });

    vi.spyOn(axios, "create").mockReturnValue({
      get: mockGet,
    } as unknown as AxiosInstance);

    const result = await getByUrl("/test");

    expect(mockGet).toHaveBeenCalledWith("/test");
    expect(result).toEqual({ foo: "bar" });
  });
});
