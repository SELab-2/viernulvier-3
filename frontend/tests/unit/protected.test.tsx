import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthSessionProvider, Protected } from "~/features/auth";
import * as loginServiceModule from "~/features/auth/services/loginService";

const baseUser = {
  id: 7,
  username: "manager",
  isSuperUser: false,
  roles: ["manager"],
  permissions: ["users:read"],
  createdAt: "2026-03-30T10:00:00",
  lastLoginAt: null,
};

function renderProtected(
  ui: React.ReactNode,
  restoreSessionResult: typeof baseUser | null = null
) {
  vi.spyOn(loginServiceModule, "restoreSession").mockResolvedValue(
    restoreSessionResult
  );

  return render(<AuthSessionProvider>{ui}</AuthSessionProvider>);
}

describe("Protected", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders fallback for anonymous users", async () => {
    renderProtected(
      <Protected fallback={<span>FALLBACK</span>}>
        <span>SECRET</span>
      </Protected>
    );

    await waitFor(() => {
      expect(screen.getByText("FALLBACK")).toBeInTheDocument();
    });

    expect(screen.queryByText("SECRET")).not.toBeInTheDocument();
  });

  it("renders children for authenticated users", async () => {
    renderProtected(
      <Protected fallback={<span>FALLBACK</span>}>
        <span>SECRET</span>
      </Protected>,
      baseUser
    );

    await waitFor(() => {
      expect(screen.getByText("SECRET")).toBeInTheDocument();
    });
  });

  it("blocks users without the required permission", async () => {
    renderProtected(
      <Protected permissions={["users:update"]} fallback={<span>DENIED</span>}>
        <span>SECRET</span>
      </Protected>,
      baseUser
    );

    await waitFor(() => {
      expect(screen.getByText("DENIED")).toBeInTheDocument();
    });

    expect(screen.queryByText("SECRET")).not.toBeInTheDocument();
  });

  it("allows matching any permission when configured", async () => {
    renderProtected(
      <Protected
        permissions={["users:update", "users:read"]}
        requireAllPermissions={false}
        fallback={<span>DENIED</span>}
      >
        <span>SECRET</span>
      </Protected>,
      baseUser
    );

    await waitFor(() => {
      expect(screen.getByText("SECRET")).toBeInTheDocument();
    });
  });

  it("requires a super user when configured", async () => {
    renderProtected(
      <Protected requireSuperUser fallback={<span>DENIED</span>}>
        <span>SECRET</span>
      </Protected>,
      baseUser
    );

    await waitFor(() => {
      expect(screen.getByText("DENIED")).toBeInTheDocument();
    });

    expect(screen.queryByText("SECRET")).not.toBeInTheDocument();
  });

  it("allows a super user when requireSuperUser is set", async () => {
    renderProtected(
      <Protected requireSuperUser fallback={<span>DENIED</span>}>
        <span>SECRET</span>
      </Protected>,
      {
        ...baseUser,
        isSuperUser: true,
      }
    );

    await waitFor(() => {
      expect(screen.getByText("SECRET")).toBeInTheDocument();
    });
  });

  it("lets super users bypass role and permission checks", async () => {
    renderProtected(
      <Protected
        roles={["admin"]}
        permissions={["users:update"]}
        fallback={<span>DENIED</span>}
      >
        <span>SECRET</span>
      </Protected>,
      {
        ...baseUser,
        isSuperUser: true,
        roles: [],
        permissions: [],
      }
    );

    await waitFor(() => {
      expect(screen.getByText("SECRET")).toBeInTheDocument();
    });
  });
});
