import axios from "axios";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuthSessionContextValue, IAuthUser } from "~/features/auth/auth.types";
import LoginPage from "~/features/auth/pages/LoginPage";

const mockNavigate = vi.fn();
const mockLogin = vi.fn();

let mockAuthSession: IAuthSessionContextValue;

vi.mock("react-router", () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  useNavigate: () => mockNavigate,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("~/features/auth", () => ({
  useAuthSession: () => mockAuthSession,
}));

vi.mock("~/shared/hooks/useLocalizedPath", () => ({
  useLocalizedPath: () => (path: string) =>
    `/en${path.startsWith("/") ? path : `/${path}`}`,
}));

function createUser(overrides: Partial<IAuthUser> = {}): IAuthUser {
  return {
    id: 1,
    username: "editor",
    isSuperUser: false,
    roles: ["editor"],
    permissions: ["events:update"],
    createdAt: "2026-04-06T12:00:00",
    lastLoginAt: null,
    ...overrides,
  };
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockReset();
    mockLogin.mockReset();
    mockLogin.mockResolvedValue(createUser());

    mockAuthSession = {
      status: "anonymous",
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: mockLogin,
      logout: vi.fn(),
      refreshSession: vi.fn().mockResolvedValue(null),
    };
  });

  afterEach(() => {
    cleanup();
  });

  it("shows a loading state while the session bootstrap is in progress", () => {
    mockAuthSession = {
      ...mockAuthSession,
      status: "loading",
      isLoading: true,
    };

    render(<LoginPage />);

    expect(screen.getByText("auth.login.loading")).toBeTruthy();
    expect(screen.queryByLabelText("auth.login.usernameLabel")).toBeNull();
  });

  it("redirects authenticated users away from the login page", () => {
    mockAuthSession = {
      ...mockAuthSession,
      status: "authenticated",
      isAuthenticated: true,
      user: createUser(),
    };

    render(<LoginPage />);

    expect(screen.getByTestId("navigate").getAttribute("data-to")).toBe("/en/");
  });

  it("submits the credentials and navigates to the localized home page", async () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("auth.login.usernameLabel"), {
      target: { value: "editor" },
    });
    fireEvent.change(screen.getByLabelText("auth.login.passwordLabel"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "auth.login.submit" }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: "editor",
        password: "secret",
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/en/", { replace: true });
  });

  it("shows a dedicated invalid credentials message for 401 responses", async () => {
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);
    mockLogin.mockRejectedValue({ response: { status: 401 } });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("auth.login.usernameLabel"), {
      target: { value: "editor" },
    });
    fireEvent.change(screen.getByLabelText("auth.login.passwordLabel"), {
      target: { value: "wrong-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "auth.login.submit" }));

    await waitFor(() => {
      expect(screen.getByText("auth.login.errors.invalidCredentials")).toBeTruthy();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows the generic error message for non-401 failures", async () => {
    mockLogin.mockRejectedValue(new Error("boom"));

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("auth.login.usernameLabel"), {
      target: { value: "editor" },
    });
    fireEvent.change(screen.getByLabelText("auth.login.passwordLabel"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "auth.login.submit" }));

    await waitFor(() => {
      expect(screen.getByText("auth.login.errors.generic")).toBeTruthy();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("toggles password visibility", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText("auth.login.passwordLabel").getAttribute("type")).toBe(
      "password"
    );

    fireEvent.click(screen.getByRole("button", { name: "auth.login.showPassword" }));

    expect(screen.getByLabelText("auth.login.passwordLabel").getAttribute("type")).toBe(
      "text"
    );
    expect(
      screen.getByRole("button", { name: "auth.login.hidePassword" })
    ).toBeTruthy();
  });
});
