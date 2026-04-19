import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthSessionProvider } from "~/features/auth";
import * as loginServiceModule from "~/features/auth/services/loginService";
import * as userManagementServiceModule from "~/features/users/services/userManagementService";
import UsersRoute from "~/routes/users";

const baseUser = {
  id: 4,
  username: "editor",
  isSuperUser: false,
  roles: ["editor"],
  permissions: [],
  createdAt: "2026-03-30T10:00:00",
  lastLoginAt: null,
};

describe("UsersRoute", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the access denied state without users:read", async () => {
    vi.spyOn(loginServiceModule, "restoreSession").mockResolvedValue(baseUser);
    const listUsersSpy = vi.spyOn(userManagementServiceModule, "listUsers");

    render(
      <AuthSessionProvider>
        <UsersRoute />
      </AuthSessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("I18N_Users_Access_Denied_Title")).toBeInTheDocument();
    });

    expect(listUsersSpy).not.toHaveBeenCalled();
  });

  it("renders the management page for users with users:read", async () => {
    vi.spyOn(loginServiceModule, "restoreSession").mockResolvedValue({
      ...baseUser,
      permissions: ["users:read"],
    });
    vi.spyOn(userManagementServiceModule, "listUsers").mockResolvedValue([]);

    render(
      <AuthSessionProvider>
        <UsersRoute />
      </AuthSessionProvider>
    );

    expect(await screen.findByText("I18N_Users_Title")).toBeInTheDocument();
  });
});
