import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { createApiClient, getByUrl } from "~/shared/services/apiClient";
import * as envModule from "~/shared/utils/env";
import * as authModule from "~/features/auth";
import { setupLocalStorage } from "tests/globalSetup";

vi.mock("~/features/auth");
setupLocalStorage();

describe("createApiClient", () => {
  let mockAdapter: AxiosMockAdapter;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(envModule, "getEnv").mockReturnValue({
      API_BASE_URL: "http://localhost",
    });

    const apiClient = axios.create();
    mockAdapter = new AxiosMockAdapter(apiClient);
    vi.spyOn(axios, "create").mockReturnValue(apiClient);
  });

  it("creates axios instance with correct config", () => {
    const mockCreate = vi.spyOn(axios, "create");

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

    const client = createApiClient();
    expect(client.defaults.headers.common["Authorization"]).toBe(
      "Bearer test_token1234"
    );
  });

  it("returns response data on GET request", async () => {
    mockAdapter.onGet("/test").reply(200, { foo: "bar" });

    const apiClient = createApiClient();
    const response = await apiClient.get("/test");

    expect(response.data).toEqual({ foo: "bar" });
  });

  it("retries request after 401 using refresh token", async () => {
    localStorage.setItem("refresh_token", "refresh123");

    const apiClient = createApiClient();
    const refreshMock = vi.mocked(authModule.refreshToken).mockResolvedValue(undefined);

    // First reply
    mockAdapter.onGet("/admins-only-endpoint").replyOnce(401);

    // Retry reply
    mockAdapter.onGet("/admins-only-endpoint").replyOnce(200, { success: true });

    const response = await apiClient.get("/admins-only-endpoint");

    expect(refreshMock).toHaveBeenCalledWith(apiClient);
    expect(response.data).toEqual({ success: true });
  });

  it("does not retry again on failed retry", async () => {
    localStorage.setItem("refresh_token", "refresh123");

    const apiClient = createApiClient();
    vi.mocked(authModule.refreshToken).mockResolvedValue(undefined);

    mockAdapter.onGet("/secret-endpoint-for-nobody").reply(401);
    await expect(apiClient.get("/secret-endpoint-for-nobody")).rejects.toBeTruthy();

    // Should only attempt refresh once
    expect(authModule.refreshToken).toHaveBeenCalledTimes(1);
  });
});

describe("getByUrl", () => {
  let mockAdapter: AxiosMockAdapter;

  beforeEach(() => {
    const apiClient = axios.create();
    mockAdapter = new AxiosMockAdapter(apiClient);

    vi.spyOn(axios, "create").mockReturnValue(apiClient);
  });

  it("returns response data", async () => {
    mockAdapter.onGet("/test").reply(200, { foo: "bar" });

    const result = await getByUrl("/test");
    expect(result).toEqual({ foo: "bar" });
  });
});

describe("401 retry token behaviour", () => {
  let mockAdapter: AxiosMockAdapter;

  beforeEach(() => {
    vi.clearAllMocks();

    const apiClient = createApiClient();
    mockAdapter = new AxiosMockAdapter(apiClient);
    vi.spyOn(axios, "create").mockReturnValue(apiClient);
  });

  afterEach(() => {
    mockAdapter.restore();
    vi.restoreAllMocks();
  });

  it("sends the NEW token on retry, not the stale one", async () => {
    const oldToken = "old-expired-token";
    const newToken = "new-fresh-token";
    localStorage.setItem("access_token", oldToken);
    localStorage.setItem("refresh_token", "refresh123");

    vi.mocked(authModule.refreshToken).mockImplementation(async () => {
      localStorage.setItem("access_token", newToken);
    });

    let retryAuthHeader: string | undefined;

    mockAdapter.onGet("/api/v1/archive/token-test").reply((config) => {
      const token = config.headers?.["Authorization"];
      if (token === `Bearer ${oldToken}`) return [401, {}];

      retryAuthHeader = config.headers?.["Authorization"] as string;

      return [200, {}];
    });

    const { getFromArchive } = await import("~/shared/services/apiClient");
    await getFromArchive("/token-test");

    expect(retryAuthHeader).toBe(`Bearer ${newToken}`);
  });
});
