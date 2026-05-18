import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

import * as envModule from "~/shared/utils/env";
import { createApiClient } from "~/shared/services/apiClient";
import { listPermissions } from "~/features/users/services/permissionManagementService";

describe("permissionManagementService", () => {
  let mockAdapter: AxiosMockAdapter;

  beforeEach(() => {
    vi.spyOn(envModule, "getEnv").mockReturnValue({
      API_BASE_URL: "http://localhost",
    });

    const apiClient = createApiClient();
    mockAdapter = new AxiosMockAdapter(apiClient);
    vi.spyOn(axios, "create").mockReturnValue(apiClient);
  });

  it("lists permissions as plain permission names", async () => {
    mockAdapter
      .onGet("/api/v1/auth/permissions")
      .reply(200, [{ name: "users:read" }, { name: "archive:create" }]);

    await expect(listPermissions()).resolves.toEqual(["archive:create", "users:read"]);
  });

  it("rejects when the server returns an error", async () => {
    mockAdapter.onGet("/api/v1/auth/permissions").reply(403, { detail: "Forbidden" });

    await expect(listPermissions()).rejects.toMatchObject({
      response: { status: 403 },
    });
  });
});
