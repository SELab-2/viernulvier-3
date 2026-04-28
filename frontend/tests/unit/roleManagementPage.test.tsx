import { render, screen, waitForElementToBeRemoved } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authSessionValue = {
  isAuthenticated: true,
  isLoading: false,
  user: {
    id: 99,
    username: "manager",
    isSuperUser: false,
    roles: [],
    permissions: ["users:read", "users:create"],
    createdAt: "2026-04-09T10:00:00",
    lastLoginAt: null,
  },
  login: vi.fn(),
  logout: vi.fn(),
  refreshSession: vi.fn(),
  status: "authenticated" as const,
};

const tFn = (key: string, opts?: Record<string, string>) => {
  if (opts) {
    return Object.entries(opts).reduce(
      (acc, [k, v]) => acc.replace(`{{${k}}}`, v),
      key
    );
  }
  return key;
};

const i18nObj = { language: "en" };

vi.mock("react-i18next", async () => {
  const actual = await vi.importActual<typeof import("react-i18next")>("react-i18next");

  return {
    ...actual,
    useTranslation: () => ({
      t: tFn,
      i18n: i18nObj,
    }),
  };
});

vi.mock("~/features/auth", () => ({
  useAuthSession: () => authSessionValue,
}));

import UserManagementPage from "~/features/users/pages/UserManagementPage";
import * as userManagementServiceModule from "~/features/users/services/userManagementService";
import * as roleManagementServiceModule from "~/features/users/services/roleManagementService";
import type { IRole } from "~/features/users/users.types";

const roles: IRole[] = [
  { id: 1, name: "editor", permissions: ["archive:write"] },
  { id: 2, name: "viewer", permissions: [] },
];

describe("UserManagementPage – roles section", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    authSessionValue.user = {
      id: 99,
      username: "manager",
      isSuperUser: false,
      roles: [],
      permissions: ["users:read", "users:create"],
      createdAt: "2026-04-09T10:00:00",
      lastLoginAt: null,
    };
    vi.spyOn(userManagementServiceModule, "listUsers").mockResolvedValue([]);
  });

  it("renders roles in cards after loading", async () => {
    vi.spyOn(roleManagementServiceModule, "listRoles").mockResolvedValue(roles);

    render(<UserManagementPage />);

    expect(await screen.findByText("editor")).toBeInTheDocument();
    expect(screen.getByText("viewer")).toBeInTheDocument();
    expect(screen.getByText("archive:write")).toBeInTheDocument();
    expect(screen.getByText("users.roles.empty.permissions")).toBeInTheDocument();
  });

  it("renders the empty state when no roles exist", async () => {
    vi.spyOn(roleManagementServiceModule, "listRoles").mockResolvedValue([]);

    render(<UserManagementPage />);

    expect(await screen.findByText("users.roles.empty.title")).toBeInTheDocument();
    expect(screen.getByText("users.roles.empty.description")).toBeInTheDocument();
  });

  it("shows an error banner when roles fail to load", async () => {
    vi.spyOn(roleManagementServiceModule, "listRoles").mockRejectedValue({
      isAxiosError: true,
      response: { data: { detail: "Roles fetch failed" } },
    } as AxiosError);

    render(<UserManagementPage />);

    expect(await screen.findByText("Roles fetch failed")).toBeInTheDocument();
  });

  it("falls back to the generic roles load failure message for non-axios errors", async () => {
    vi.spyOn(roleManagementServiceModule, "listRoles").mockRejectedValue(
      new Error("network error")
    );

    render(<UserManagementPage />);

    expect(
      await screen.findByText("users.roles.messages.loadFailed")
    ).toBeInTheDocument();
  });

  it("shows the add role button when user has users:create permission", async () => {
    vi.spyOn(roleManagementServiceModule, "listRoles").mockResolvedValue([]);

    render(<UserManagementPage />);

    expect(await screen.findByText("users.roles.empty.title")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "users.roles.actions.add" })
    ).toBeInTheDocument();
  });

  it("hides the add role button without create permission", async () => {
    authSessionValue.user = { ...authSessionValue.user, permissions: ["users:read"] };
    vi.spyOn(roleManagementServiceModule, "listRoles").mockResolvedValue([]);

    render(<UserManagementPage />);

    expect(await screen.findByText("users.roles.empty.title")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "users.roles.actions.add" })
    ).toBeNull();
  });

  it("creates a role from the add dialog and appends it to the list", async () => {
    vi.spyOn(roleManagementServiceModule, "listRoles").mockResolvedValue([]);
    vi.spyOn(roleManagementServiceModule, "createRole").mockResolvedValue({
      id: 10,
      name: "moderator",
      permissions: [],
    });

    const user = userEvent.setup();
    render(<UserManagementPage />);

    await screen.findByText("users.roles.empty.title");

    await user.click(
      await screen.findByRole("button", { name: "users.roles.actions.add" })
    );
    await user.type(
      await screen.findByLabelText("users.roles.fields.name"),
      "moderator"
    );
    await user.click(
      screen.getByRole("button", { name: "users.roles.actions.create" })
    );

    expect(roleManagementServiceModule.createRole).toHaveBeenCalledWith({
      name: "moderator",
    });

    await screen.findByText("moderator");
    expect(screen.queryByText("users.roles.empty.title")).toBeNull();
  });

  it("validates that the role name is required", async () => {
    vi.spyOn(roleManagementServiceModule, "listRoles").mockResolvedValue([]);

    const user = userEvent.setup();
    render(<UserManagementPage />);

    await screen.findByText("users.roles.empty.title");
    await user.click(screen.getByRole("button", { name: "users.roles.actions.add" }));

    const createForm = document.querySelector("#role-form-dialog");
    expect(createForm).not.toBeNull();

    const { fireEvent } = await import("@testing-library/react");
    fireEvent.submit(createForm as HTMLFormElement);

    expect(
      await screen.findByText("users.roles.messages.nameRequired")
    ).toBeInTheDocument();
  });

  it("shows API errors and resets dialog state on close", async () => {
    vi.spyOn(roleManagementServiceModule, "listRoles").mockResolvedValue([]);
    vi.spyOn(roleManagementServiceModule, "createRole").mockRejectedValue({
      isAxiosError: true,
      response: { data: { detail: "Role name already exists" } },
    } as AxiosError);

    const user = userEvent.setup();
    render(<UserManagementPage />);

    await screen.findByText("users.roles.empty.title");
    await user.click(screen.getByRole("button", { name: "users.roles.actions.add" }));
    await user.type(screen.getByLabelText("users.roles.fields.name"), "editor");
    await user.click(
      screen.getByRole("button", { name: "users.roles.actions.create" })
    );

    expect(await screen.findByText("Role name already exists")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "users.actions.cancel" }));
    await waitForElementToBeRemoved(() =>
      screen.queryByText("users.roles.dialogs.create.title")
    );

    await user.click(
      await screen.findByRole("button", { name: "users.roles.actions.add" })
    );
    const nameInput = screen.getByLabelText(
      "users.roles.fields.name"
    ) as HTMLInputElement;
    expect(nameInput.value).toBe("");
  });
});
