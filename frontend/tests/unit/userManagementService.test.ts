import AxiosMockAdapter from "axios-mock-adapter";
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as envModule from "~/shared/utils/env";
import { createApiClient } from "~/shared/services/apiClient";
import { listUsers } from "~/features/users/services/userManagementService";

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
        id: 5,
        username: "curator",
        super_user: false,
        roles: ["editor"],
        permissions: ["users:read"],
        created_at: "2026-04-10T12:30:00",
        last_login_at: null,
      },
    ]);

    await expect(listUsers()).resolves.toEqual([
      {
        id: 5,
        username: "curator",
        isSuperUser: false,
        roles: ["editor"],
        permissions: ["users:read"],
        createdAt: "2026-04-10T12:30:00",
        lastLoginAt: null,
      },
    ]);
  });
});
