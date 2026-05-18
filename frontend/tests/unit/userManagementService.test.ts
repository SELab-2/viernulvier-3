import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

import * as envModule from "~/shared/utils/env";
import { createApiClient } from "~/shared/services/apiClient";
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
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
        id: 8,
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
      id: 12,
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

    expect(mockAdapter.history.post[0].data).toBe(
      JSON.stringify({ username: "new-user", password: "temporary-secret" })
    );
  });

  it("sends selected roles when creating a user", async () => {
    mockAdapter.onPost("/api/v1/auth/users").reply(201, {
      id: 13,
      id_url: "http://localhost/api/v1/auth/users/13",
      username: "editor-user",
      super_user: false,
      roles: ["editor", "viewer"],
      permissions: ["users:read"],
      created_at: "2026-04-16T10:45:00",
      last_login_at: null,
    });

    await expect(
      createUser({
        username: "editor-user",
        password: "temporary-secret",
        roles: ["editor", "viewer"],
      })
    ).resolves.toEqual({
      id: 13,
      username: "editor-user",
      isSuperUser: false,
      roles: ["editor", "viewer"],
      permissions: ["users:read"],
      createdAt: "2026-04-16T10:45:00",
      lastLoginAt: null,
    });

    expect(mockAdapter.history.post[0].data).toBe(
      JSON.stringify({
        username: "editor-user",
        password: "temporary-secret",
        roles: ["editor", "viewer"],
      })
    );
  });

  it("patches a user and returns the mapped result", async () => {
    mockAdapter.onPatch("/api/v1/auth/users/12").reply(200, {
      id: 12,
      id_url: "http://localhost/api/v1/auth/users/12",
      username: "updated-user",
      super_user: false,
      roles: ["editor"],
      permissions: ["archive:write"],
      created_at: "2026-04-15T09:30:00",
      last_login_at: "2026-04-16T08:00:00",
    });

    await expect(
      updateUser(12, {
        username: "updated-user",
        roles: ["editor"],
        password: "fresh-secret",
      })
    ).resolves.toEqual({
      id: 12,
      username: "updated-user",
      isSuperUser: false,
      roles: ["editor"],
      permissions: ["archive:write"],
      createdAt: "2026-04-15T09:30:00",
      lastLoginAt: "2026-04-16T08:00:00",
    });

    expect(mockAdapter.history.patch[0].url).toBe("/api/v1/auth/users/12");
    expect(mockAdapter.history.patch[0].data).toBe(
      JSON.stringify({
        username: "updated-user",
        roles: ["editor"],
        password: "fresh-secret",
      })
    );
  });

  it("deletes a user by id and resolves without a value", async () => {
    mockAdapter.onDelete("/api/v1/auth/users/12").reply(204);

    await expect(deleteUser(12)).resolves.toBeUndefined();
    expect(mockAdapter.history.delete).toHaveLength(1);
    expect(mockAdapter.history.delete[0].url).toBe("/api/v1/auth/users/12");
  });

  it("rejects when the server returns an error on delete", async () => {
    mockAdapter.onDelete("/api/v1/auth/users/99").reply(404, { detail: "Not found" });

    await expect(deleteUser(99)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
