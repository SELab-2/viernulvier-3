import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

import * as envModule from "~/shared/utils/env";
import { createApiClient } from "~/shared/services/apiClient";
import {
  createRole,
  deleteRole,
  listRoles,
} from "~/features/users/services/roleManagementService";

describe("roleManagementService", () => {
  let mockAdapter: AxiosMockAdapter;

  beforeEach(() => {
    vi.spyOn(envModule, "getEnv").mockReturnValue({
      API_BASE_URL: "http://localhost",
    });

    const apiClient = createApiClient();
    mockAdapter = new AxiosMockAdapter(apiClient);
    vi.spyOn(axios, "create").mockReturnValue(apiClient);
  });

  it("lists roles and maps the backend payload", async () => {
    mockAdapter.onGet("/api/v1/auth/roles").reply(200, [
      {
        id_url: "http://localhost/api/v1/auth/roles/3",
        name: "editor",
        permissions: ["users:read", "archive:write"],
      },
    ]);

    await expect(listRoles()).resolves.toEqual([
      {
        id: 3,
        name: "editor",
        permissions: ["users:read", "archive:write"],
      },
    ]);
  });

  it("returns an empty list when no roles exist", async () => {
    mockAdapter.onGet("/api/v1/auth/roles").reply(200, []);

    await expect(listRoles()).resolves.toEqual([]);
  });

  it("rejects when the server returns an error on list", async () => {
    mockAdapter.onGet("/api/v1/auth/roles").reply(403, { detail: "Forbidden" });

    await expect(listRoles()).rejects.toMatchObject({
      response: { status: 403 },
    });
  });

  it("creates a role and returns the mapped result", async () => {
    mockAdapter.onPost("/api/v1/auth/roles").reply(201, {
      id_url: "http://localhost/api/v1/auth/roles/7",
      name: "moderator",
      permissions: [],
    });

    await expect(createRole({ name: "moderator" })).resolves.toEqual({
      id: 7,
      name: "moderator",
      permissions: [],
    });

    expect(mockAdapter.history.post[0].data).toBe(
      JSON.stringify({ name: "moderator" })
    );
  });

  it("rejects when the server returns a conflict on create", async () => {
    mockAdapter
      .onPost("/api/v1/auth/roles")
      .reply(409, { detail: "Role name already exists" });

    await expect(createRole({ name: "editor" })).rejects.toMatchObject({
      response: { status: 409 },
    });
  });

  it("deletes a role", async () => {
    mockAdapter.onDelete("/api/v1/auth/roles/12").reply(204);

    await expect(deleteRole(12)).resolves.toBeUndefined();
  });

  it("rejects when the server returns an error on delete", async () => {
    mockAdapter
      .onDelete("/api/v1/auth/roles/99")
      .reply(404, { detail: "Role not found" });

    await expect(deleteRole(99)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
