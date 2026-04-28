import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
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

const pageI18n = { language: "en" };

function pageTranslate(key: string) {
  const map: Record<string, string> = {
    "users.loading": "I18N_Users_Loading",
  };

  return map[key] || key;
}

vi.mock("react-i18next", async () => {
  const actual = await vi.importActual<typeof import("react-i18next")>("react-i18next");

  return {
    ...actual,
    useTranslation: () => ({
      t: pageTranslate,
      i18n: pageI18n,
    }),
  };
});

vi.mock("~/features/auth", () => ({
  useAuthSession: () => authSessionValue,
}));

import UserManagementPage from "~/features/users/pages/UserManagementPage";
import * as userManagementServiceModule from "~/features/users/services/userManagementService";
import * as roleManagementServiceModule from "~/features/users/services/roleManagementService";
import type { IUser } from "~/features/users/users.types";

const dateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
} as const;

const users: IUser[] = [
  {
    id: 5,
    username: "curator",
    isSuperUser: false,
    roles: ["editor"],
    permissions: ["users:read"],
    createdAt: "2026-04-10T12:30:00",
    lastLoginAt: null,
  },
  {
    id: 6,
    username: "admin",
    isSuperUser: true,
    roles: [],
    permissions: [],
    createdAt: "2026-04-11T09:15:00",
    lastLoginAt: "not-a-date",
  },
];

describe("UserManagementPage", () => {
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
    // Default: roles load successfully with an empty list so existing
    // user-focused tests are not affected by the roles section.
    vi.spyOn(roleManagementServiceModule, "listRoles").mockResolvedValue([]);
  });

  it("renders the empty state when no users are returned", async () => {
    vi.spyOn(userManagementServiceModule, "listUsers").mockResolvedValue([]);

    render(<UserManagementPage />);

    expect(screen.getByText("I18N_Users_Loading")).toBeInTheDocument();
    expect(await screen.findByText("users.empty.title")).toBeInTheDocument();
    expect(screen.getByText("users.empty.description")).toBeInTheDocument();

    const totalUsersCard = screen.getByText("users.summary.totalUsers").parentElement;
    const superUsersCard = screen.getByText("users.summary.superUsers").parentElement;

    expect(totalUsersCard).not.toBeNull();
    expect(superUsersCard).not.toBeNull();
    expect(within(totalUsersCard as HTMLElement).getByText("0")).toBeInTheDocument();
    expect(within(superUsersCard as HTMLElement).getByText("0")).toBeInTheDocument();
  });

  it("shows the api error, retries, and renders mixed user data", async () => {
    vi.spyOn(userManagementServiceModule, "listUsers")
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { data: { detail: "Backend says no" } },
      } as AxiosError)
      .mockResolvedValueOnce(users);

    const user = userEvent.setup();

    render(<UserManagementPage />);

    expect(await screen.findByText("Backend says no")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "users.actions.retry" }));

    expect(await screen.findByText("curator")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "admin" })).toBeInTheDocument();
    expect(screen.getByText("users.badges.superUser")).toBeInTheDocument();
    expect(screen.getByText("users.empty.roles")).toBeInTheDocument();
    expect(screen.getByText("users.empty.permissions")).toBeInTheDocument();
    expect(screen.getByText("users.empty.date")).toBeInTheDocument();
    expect(screen.getByText("not-a-date")).toBeInTheDocument();
    expect(
      screen.getByText(
        new Intl.DateTimeFormat("en", dateTimeFormatOptions).format(
          new Date(users[0].createdAt)
        )
      )
    ).toBeInTheDocument();

    const totalUsersCard = screen.getByText("users.summary.totalUsers").parentElement;
    const superUsersCard = screen.getByText("users.summary.superUsers").parentElement;

    expect(totalUsersCard).not.toBeNull();
    expect(superUsersCard).not.toBeNull();
    expect(within(totalUsersCard as HTMLElement).getByText("2")).toBeInTheDocument();
    expect(within(superUsersCard as HTMLElement).getByText("1")).toBeInTheDocument();
  });

  it("falls back to the generic load failure message for non-axios errors", async () => {
    vi.spyOn(userManagementServiceModule, "listUsers").mockRejectedValue(
      new Error("boom")
    );

    render(<UserManagementPage />);

    expect(await screen.findByText("users.messages.loadFailed")).toBeInTheDocument();
  });

  it("creates a user from the add dialog", async () => {
    vi.spyOn(userManagementServiceModule, "listUsers").mockResolvedValue([]);
    vi.spyOn(userManagementServiceModule, "createUser").mockResolvedValue({
      id: 7,
      username: "fresh-account",
      isSuperUser: false,
      roles: [],
      permissions: [],
      createdAt: "2026-04-15T10:00:00",
      lastLoginAt: null,
    });

    const user = userEvent.setup();

    render(<UserManagementPage />);

    await screen.findByText("users.empty.title");
    await user.click(screen.getByRole("button", { name: "users.actions.add" }));
    await user.type(screen.getByLabelText("users.fields.username"), " fresh-account ");
    await user.type(screen.getByLabelText("users.fields.password"), "temporary-secret");
    await user.click(screen.getByRole("button", { name: "users.actions.create" }));

    expect(userManagementServiceModule.createUser).toHaveBeenCalledWith({
      username: "fresh-account",
      password: "temporary-secret",
    });

    const createdUserCard = (await screen.findByText("fresh-account")).closest(
      "article"
    );

    expect(createdUserCard).not.toBeNull();
  });

  it("validates create form fields and clears validation on input change", async () => {
    vi.spyOn(userManagementServiceModule, "listUsers").mockResolvedValue([]);

    const user = userEvent.setup();
    render(<UserManagementPage />);

    await screen.findByText("users.empty.title");
    await user.click(screen.getByRole("button", { name: "users.actions.add" }));

    const createForm = document.querySelector("#user-form-dialog");
    expect(createForm).not.toBeNull();

    fireEvent.submit(createForm as HTMLFormElement);
    expect(
      await screen.findByText("users.messages.usernameRequired")
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("users.fields.username"), "operator");
    expect(screen.queryByText("users.messages.usernameRequired")).toBeNull();

    fireEvent.submit(createForm as HTMLFormElement);
    expect(
      await screen.findByText("users.messages.passwordRequired")
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("users.fields.password"), "secret");
    expect(screen.queryByText("users.messages.passwordRequired")).toBeNull();
  });

  it("shows create API errors and resets create dialog state on close", async () => {
    vi.spyOn(userManagementServiceModule, "listUsers").mockResolvedValue([]);
    vi.spyOn(userManagementServiceModule, "createUser").mockRejectedValue({
      isAxiosError: true,
      response: { data: { detail: "Username already exists" } },
    });

    const user = userEvent.setup();
    render(<UserManagementPage />);

    await screen.findByText("users.empty.title");

    await user.click(screen.getByRole("button", { name: "users.actions.add" }));
    await user.type(screen.getByLabelText("users.fields.username"), "operator");
    await user.type(screen.getByLabelText("users.fields.password"), "secret");
    await user.click(screen.getByRole("button", { name: "users.actions.create" }));

    expect(await screen.findByText("Username already exists")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "users.actions.cancel" }));
    await waitForElementToBeRemoved(() =>
      screen.queryByText("users.dialogs.create.title")
    );

    await user.click(await screen.findByRole("button", { name: "users.actions.add" }));
    const usernameInput = screen.getByLabelText(
      "users.fields.username"
    ) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(
      "users.fields.password"
    ) as HTMLInputElement;
    expect(usernameInput.value).toBe("");
    expect(passwordInput.value).toBe("");
  });

  it("hides create actions without the matching permissions", async () => {
    authSessionValue.user = {
      ...authSessionValue.user,
      permissions: ["users:read"],
    };
    vi.spyOn(userManagementServiceModule, "listUsers").mockResolvedValue(users);

    render(<UserManagementPage />);

    expect(await screen.findByText("curator")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "users.actions.add" })).toBeNull();
  });

  it("shows delete buttons when the current user has users:delete permission", async () => {
    authSessionValue.user = {
      ...authSessionValue.user,
      permissions: ["users:read", "users:delete"],
    };
    vi.spyOn(userManagementServiceModule, "listUsers").mockResolvedValue(users);

    render(<UserManagementPage />);

    expect(await screen.findByText("curator")).toBeInTheDocument();
    const deleteButtons = screen.getAllByRole("button", {
      name: "users.actions.delete",
    });

    expect(deleteButtons).toHaveLength(users.length);
  });

  it("hides delete buttons without the users:delete permission", async () => {
    authSessionValue.user = {
      ...authSessionValue.user,
      permissions: ["users:read", "users:create"],
    };
    vi.spyOn(userManagementServiceModule, "listUsers").mockResolvedValue(users);

    render(<UserManagementPage />);

    expect(await screen.findByText("curator")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "users.actions.delete" })).toBeNull();
  });

  it("hides the delete button on the current user's own card", async () => {
    authSessionValue.user = {
      ...authSessionValue.user,
      id: users[0].id,
      permissions: ["users:read", "users:delete"],
    };
    vi.spyOn(userManagementServiceModule, "listUsers").mockResolvedValue(users);

    render(<UserManagementPage />);

    expect(await screen.findByText("curator")).toBeInTheDocument();
    // Only one delete button — not on the current user's own card
    const deleteButtons = screen.getAllByRole("button", {
      name: "users.actions.delete",
    });

    expect(deleteButtons).toHaveLength(users.length - 1);
  });

  it("removes the user from the list after confirming deletion", async () => {
    authSessionValue.user = {
      ...authSessionValue.user,
      permissions: ["users:read", "users:delete"],
    };
    vi.spyOn(userManagementServiceModule, "listUsers").mockResolvedValue(users);
    vi.spyOn(userManagementServiceModule, "deleteUser").mockResolvedValue(undefined);

    const user = userEvent.setup();

    render(<UserManagementPage />);

    expect(await screen.findByText("curator")).toBeInTheDocument();

    const curatorCard = screen
      .getByRole("heading", { name: "curator" })
      .closest("article");
    expect(curatorCard).not.toBeNull();

    await user.click(
      within(curatorCard as HTMLElement).getByRole("button", {
        name: "users.actions.delete",
      })
    );

    expect(await screen.findByText("users.dialogs.delete.title")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "users.actions.delete" }));

    expect(userManagementServiceModule.deleteUser).toHaveBeenCalledWith(users[0].id);
    expect(await screen.findByText("admin")).toBeInTheDocument();
    expect(screen.queryByText("curator")).toBeNull();
  });

  it("shows an error message when deletion fails", async () => {
    authSessionValue.user = {
      ...authSessionValue.user,
      permissions: ["users:read", "users:delete"],
    };
    vi.spyOn(userManagementServiceModule, "listUsers").mockResolvedValue(users);
    vi.spyOn(userManagementServiceModule, "deleteUser").mockRejectedValue({
      isAxiosError: true,
      response: { data: { detail: "Cannot delete last admin" } },
    });

    const user = userEvent.setup();

    render(<UserManagementPage />);

    expect(await screen.findByText("curator")).toBeInTheDocument();

    const curatorCard = screen
      .getByRole("heading", { name: "curator" })
      .closest("article");

    await user.click(
      within(curatorCard as HTMLElement).getByRole("button", {
        name: "users.actions.delete",
      })
    );

    await user.click(screen.getByRole("button", { name: "users.actions.delete" }));

    expect(await screen.findByText("Cannot delete last admin")).toBeInTheDocument();
    // The user should still be in the list
    expect(screen.getByText("curator")).toBeInTheDocument();
  });

  it("falls back to the generic delete failure message for non-axios errors", async () => {
    authSessionValue.user = {
      ...authSessionValue.user,
      permissions: ["users:read", "users:delete"],
    };
    vi.spyOn(userManagementServiceModule, "listUsers").mockResolvedValue(users);
    vi.spyOn(userManagementServiceModule, "deleteUser").mockRejectedValue(
      new Error("network failure")
    );

    const user = userEvent.setup();

    render(<UserManagementPage />);

    expect(await screen.findByText("curator")).toBeInTheDocument();

    const curatorCard = screen
      .getByRole("heading", { name: "curator" })
      .closest("article");

    await user.click(
      within(curatorCard as HTMLElement).getByRole("button", {
        name: "users.actions.delete",
      })
    );

    await user.click(screen.getByRole("button", { name: "users.actions.delete" }));

    expect(await screen.findByText("users.messages.deleteFailed")).toBeInTheDocument();
  });

  it("closes the delete dialog when cancel is clicked", async () => {
    authSessionValue.user = {
      ...authSessionValue.user,
      permissions: ["users:read", "users:delete"],
    };
    vi.spyOn(userManagementServiceModule, "listUsers").mockResolvedValue(users);

    const user = userEvent.setup();
    render(<UserManagementPage />);

    expect(await screen.findByText("curator")).toBeInTheDocument();
    const curatorCard = screen
      .getByRole("heading", { name: "curator" })
      .closest("article");

    await user.click(
      within(curatorCard as HTMLElement).getByRole("button", {
        name: "users.actions.delete",
      })
    );

    expect(await screen.findByText("users.dialogs.delete.title")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "users.actions.cancel" }));
    await waitForElementToBeRemoved(() =>
      screen.queryByText("users.dialogs.delete.title")
    );
  });
});
