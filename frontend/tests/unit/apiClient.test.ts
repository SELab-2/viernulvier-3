import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { createApiClient } from "~/shared/services/apiClient";
import * as envModule from "~/shared/utils/env";
import * as tokenRefreshModule from "~/features/auth/services/tokenRefresh";
import { getByUrl } from "~/shared/services/sharedService";

vi.mock("~/features/auth");

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
      timeout: expect.any(Number),
      headers: {
        "Content-Type": "application/json",
      },
    });
  });

  it("adds Authorization header if token exists", async () => {
    localStorage.setItem("access_token", "test_token1234");

    const client = createApiClient();
    let capturedAuthHeader: string | undefined;

    const mockAdapter = new AxiosMockAdapter(client);
    mockAdapter.onGet("/test").reply((config) => {
      capturedAuthHeader = config.headers?.["Authorization"] as string;
      return [200, {}];
    });

    await client.get("/test");
    expect(capturedAuthHeader).toBe("Bearer test_token1234");
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
    const refreshMock = vi
      .spyOn(tokenRefreshModule, "refreshAccessToken")
      .mockResolvedValue("new-token");

    // First reply
    mockAdapter.onGet("/admins-only-endpoint").replyOnce(401);

    // Retry reply
    mockAdapter.onGet("/admins-only-endpoint").replyOnce(200, { success: true });

    const response = await apiClient.get("/admins-only-endpoint");

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(response.data).toEqual({ success: true });
  });

  it("does not retry again on failed retry", async () => {
    localStorage.setItem("refresh_token", "refresh123");

    const apiClient = createApiClient();
    vi.spyOn(tokenRefreshModule, "refreshAccessToken").mockRejectedValue(
      new Error("refresh failed")
    );

    mockAdapter.onGet("/secret-endpoint-for-nobody").reply(401);
    await expect(apiClient.get("/secret-endpoint-for-nobody")).rejects.toBeTruthy();

    // Should only attempt refresh once
    expect(tokenRefreshModule.refreshAccessToken).toHaveBeenCalledTimes(1);
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

    vi.spyOn(envModule, "getEnv").mockReturnValue({
      API_BASE_URL: "http://localhost",
    });
  });

  afterEach(() => {
    if (mockAdapter) {
      mockAdapter.restore();
    }
    vi.restoreAllMocks();
  });

  it("sends the NEW token on retry, not the stale one", async () => {
    const oldToken = "old-expired-token";
    const newToken = "new-fresh-token";
    localStorage.setItem("access_token", oldToken);
    localStorage.setItem("refresh_token", "refresh123");

    vi.spyOn(tokenRefreshModule, "refreshAccessToken").mockImplementation(async () => {
      // Just update the token in localStorage
      // The request interceptor will pick up the new token automatically
      localStorage.setItem("access_token", newToken);
      return newToken;
    });

    const apiClient = createApiClient();
    mockAdapter = new AxiosMockAdapter(apiClient);

    let callCount = 0;
    let retryAuthHeader: string | undefined;

    mockAdapter.onGet("/api/v1/archive/token-test").reply((config) => {
      callCount++;

      if (callCount === 1) {
        // First call with old token -> return 401
        return [401, {}];
      }

      if (callCount === 2) {
        // Second call (retry) -> capture header and return success
        retryAuthHeader = config.headers?.["Authorization"] as string;
        return [200, { success: true }];
      }

      return [500, {}];
    });

    const result = await apiClient.get("/api/v1/archive/token-test");

    expect(result.data).toEqual({ success: true });
    expect(retryAuthHeader).toBe(`Bearer ${newToken}`);
  });

  it("does not attempt refresh without a stored refresh token", async () => {
    const refreshSpy = vi.spyOn(tokenRefreshModule, "refreshAccessToken");
    const apiClient = createApiClient();
    mockAdapter = new AxiosMockAdapter(apiClient);

    mockAdapter.onGet("/no-refresh-available").reply(401);

    await expect(apiClient.get("/no-refresh-available")).rejects.toBeTruthy();
    expect(refreshSpy).not.toHaveBeenCalled();
  });

  it("does not attempt refresh for login endpoint 401 responses", async () => {
    localStorage.setItem("refresh_token", "refresh123");

    const refreshSpy = vi.spyOn(tokenRefreshModule, "refreshAccessToken");
    const apiClient = createApiClient();
    mockAdapter = new AxiosMockAdapter(apiClient);

    mockAdapter.onPost("/api/v1/auth/login").reply(401);

    await expect(
      apiClient.post("/api/v1/auth/login", {
        username: "wrong",
        password: "wrong",
      })
    ).rejects.toBeTruthy();

    expect(refreshSpy).not.toHaveBeenCalled();
  });
});
