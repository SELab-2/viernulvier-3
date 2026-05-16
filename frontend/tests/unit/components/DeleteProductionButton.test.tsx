import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DeleteProductionButton } from "~/features/archive/components/DeleteProductionButton";
import { deleteProduction } from "~/features/archive/services/productionService";

vi.mock("~/features/archive/services/productionService", () => ({
  deleteProduction: vi.fn(),
}));

vi.mock("~/shared/hooks/useLocalizedPath", () => ({
  useLocalizedPath: () => (path: string) => `/en${path}`,
}));

vi.mock("~/features/auth", async () => {
  const { Protected } = await vi.importActual<
    typeof import("~/features/auth/components/Protected")
  >("~/features/auth/components/Protected");
  return { Protected };
});

let mockPermissions = ["archive:delete"];

vi.mock("~/features/auth/context/AuthSessionContext", async () => {
  return {
    AuthSessionProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    useAuthSession: () => ({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: 1,
        username: "admin",
        isSuperUser: false,
        roles: ["admin"],
        permissions: mockPermissions,
        createdAt: "",
        lastLoginAt: null,
      },
    }),
  };
});

function renderDeleteProductionButton(productionId: number) {
  const router = createMemoryRouter(
    [
      {
        path: "/:lang/productions/:productionId",
        element: <DeleteProductionButton productionId={productionId} />,
      },
      {
        path: "/:lang/archive",
        element: <div>Archive list page</div>,
      },
    ],
    { initialEntries: ["/en/productions/1"] }
  );

  return render(<RouterProvider router={router} />);
}

const mockDeleteProduction = vi.mocked(deleteProduction);

describe("DeleteProductionButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockDeleteProduction.mockReset();
    mockPermissions = ["archive:delete"];
  });

  it("renders the delete button when user has permission", () => {
    renderDeleteProductionButton(1);
    expect(screen.getByText("I18N_Production_Delete")).toBeInTheDocument();
  });

  it("does not render the delete button without permission", () => {
    mockPermissions = [];

    renderDeleteProductionButton(1);

    expect(screen.queryByText("I18N_Production_Delete")).not.toBeInTheDocument();
  });

  it("calls deleteProduction and navigates on confirm", async () => {
    mockDeleteProduction.mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderDeleteProductionButton(1);
    fireEvent.click(screen.getByText("I18N_Production_Delete"));

    await waitFor(() => {
      expect(mockDeleteProduction).toHaveBeenCalledWith(1);
      expect(mockDeleteProduction).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Archive list page")).toBeInTheDocument();
    });
  });

  it("does not call deleteProduction when confirm is cancelled", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);

    renderDeleteProductionButton(1);
    fireEvent.click(screen.getByText("I18N_Production_Delete"));

    expect(mockDeleteProduction).not.toHaveBeenCalled();
  });

  it("shows error alert when deleteProduction fails", async () => {
    mockDeleteProduction.mockRejectedValue(new Error("Network error"));
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderDeleteProductionButton(1);
    fireEvent.click(screen.getByText("I18N_Production_Delete"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("I18N_Production_Delete_Error");
    });
  });

  it("disables the button while deleting", async () => {
    let resolveDelete!: () => void;
    mockDeleteProduction.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveDelete = resolve;
        })
    );
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderDeleteProductionButton(1);
    const button = screen.getByText("I18N_Production_Delete");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("I18N_Production_Deleting")).toBeInTheDocument();
    });
    expect(screen.getByRole("button")).toBeDisabled();

    resolveDelete();

    await waitFor(() => {
      expect(screen.getByText("I18N_Production_Delete")).toBeInTheDocument();
    });
  });
});
