import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

import * as envModule from "~/shared/utils/env";
import { createApiClient } from "~/shared/services/apiClient";
import {
  createUser,
  deleteUser,
  listUsers,
} from "~/features/users/services/userManagementService";

describe("userManagementService", () => {
  let mockAdapter: AxiosMockAdapter;

  beforeEach(() => {
    vi.spyOn(envModule, "getEnv").mockReturnValue({
      API_BASE_URL: "http://localhost",
    });

    const apiClient = createApiClient();
    mockAdapter = new AxiosMockAdapter(apiClient);
    vi.spyOn(axios, "create").mockReturnValue(apiClient);
  });

  it("lists users and maps the backend payload", async () => {
    mockAdapter.onGet("/api/v1/auth/users").reply(200, [
      {
        id_url: "http://localhost/api/v1/auth/users/8",
        username: "operator",
        super_user: false,
        roles: ["staff"],
        permissions: ["users:read"],
        created_at: "2026-04-10T12:00:00",
        last_login_at: null,
      },
    ]);

    await expect(listUsers()).resolves.toEqual([
      {
        id: 8,
        username: "operator",
        isSuperUser: false,
        roles: ["staff"],
        permissions: ["users:read"],
        createdAt: "2026-04-10T12:00:00",
        lastLoginAt: null,
      },
    ]);
  });

  it("creates a user and returns the mapped result", async () => {
    mockAdapter.onPost("/api/v1/auth/users").reply(201, {
      id_url: "http://localhost/api/v1/auth/users/12",
      username: "new-user",
      super_user: false,
      roles: [],
      permissions: [],
      created_at: "2026-04-15T09:30:00",
      last_login_at: null,
    });

    await expect(
      createUser({ username: "new-user", password: "temporary-secret" })
    ).resolves.toEqual({
      id: 12,
      username: "new-user",
      isSuperUser: false,
      roles: [],
      permissions: [],
      createdAt: "2026-04-15T09:30:00",
      lastLoginAt: null,
    });
  });

  it("deletes a user", async () => {
    mockAdapter.onDelete("/api/v1/auth/users/8").reply(204);

    await expect(deleteUser(8)).resolves.toBeUndefined();
  });
});
