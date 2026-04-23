import { render, screen, within } from "@testing-library/react";
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
    expect(createdUserCard).not.toBeNull();
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
});
