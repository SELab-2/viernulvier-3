import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthSessionProvider } from "~/features/auth";
import * as loginServiceModule from "~/features/auth/services/loginService";
import * as productionServiceModule from "~/features/archive/services/productionService";

import { DeleteInfoButton } from "~/features/archive/components/DeleteInfoButton";

const baseUser = {
  id: 1,
  username: "editor",
  isSuperUser: false,
  roles: ["editor"],
  permissions: ["archive:update"],
  createdAt: "2026-03-30T10:00:00",
  lastLoginAt: null,
};

function renderButton(user = baseUser) {
  vi.spyOn(loginServiceModule, "restoreSession").mockResolvedValue(user);

  return render(
    <AuthSessionProvider>
      <DeleteInfoButton production_id_url="/archive/productions/123" language="nl" />
    </AuthSessionProvider>
  );
}

describe("DeleteInfoButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("renders delete button for authorized users", async () => {
    renderButton();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    });
  });

  it("does not render delete button without permission", async () => {
    renderButton({
      ...baseUser,
      permissions: [],
    });

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
    });
  });

  it("calls updateProductionByUrl when confirmed", async () => {
    const user = userEvent.setup();

    const updateSpy = vi
      .spyOn(productionServiceModule, "updateProductionByUrl")
      .mockResolvedValue({} as never);

    vi.stubGlobal("location", {
      ...window.location,
      reload: vi.fn(),
    });

    renderButton();

    const button = await screen.findByRole("button", {
      name: /delete/i,
    });

    await user.click(button);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith("/archive/productions/123", {
        remove_languages: ["nl"],
      });
    });
  });

  it("does not call service when confirmation is cancelled", async () => {
    const user = userEvent.setup();

    vi.spyOn(window, "confirm").mockReturnValue(false);

    const updateSpy = vi.spyOn(productionServiceModule, "updateProductionByUrl");

    renderButton();

    const button = await screen.findByRole("button", {
      name: /delete/i,
    });

    await user.click(button);

    await waitFor(() => {
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  it("shows alert when delete fails", async () => {
    const user = userEvent.setup();

    vi.spyOn(productionServiceModule, "updateProductionByUrl").mockRejectedValue(
      new Error("Failed")
    );

    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    renderButton();

    const button = await screen.findByRole("button", {
      name: /delete/i,
    });

    await user.click(button);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
    });
  });
});
