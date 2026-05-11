import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteBlogButton } from "~/features/blogs/components/DeleteBlogButton";
import { deleteBlog } from "~/features/blogs/services/blogService";

vi.mock("~/features/blogs/services/blogService", () => ({
  deleteBlog: vi.fn(),
}));

vi.mock("~/shared/hooks/useLocalizedPath", () => ({
  useLocalizedPath: () => (path: string) => `/en${path}`,
}));

vi.mock("~/features/auth", async () => {
  const { Protected } = await vi.importActual<typeof import("~/features/auth/components/Protected")>(
    "~/features/auth/components/Protected"
  );
  return { Protected };
});

vi.mock("~/features/auth/context/AuthSessionContext", async () => {
  return {
    AuthSessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useAuthSession: () => ({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: 1,
        username: "admin",
        isSuperUser: true,
        roles: ["admin"],
        permissions: ["blog:delete"],
        createdAt: "",
        lastLoginAt: null,
      },
    }),
  };
});

function renderDeleteBlogButton(blogId: number) {
  const router = createMemoryRouter(
    [
      {
        path: "/:lang/blogs/:blogId",
        element: <DeleteBlogButton blogId={blogId} />,
      },
      {
        path: "/:lang/blogs",
        element: <div>Blogs list page</div>,
      },
    ],
    { initialEntries: ["/en/blogs/1"] }
  );

  return render(<RouterProvider router={router} />);
}

const mockDeleteBlog = vi.mocked(deleteBlog);

describe("DeleteBlogButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockDeleteBlog.mockReset();
  });

  it("renders the delete button when user has permission", () => {
    renderDeleteBlogButton(1);
    expect(screen.getByText("I18N_Blog_Delete")).toBeInTheDocument();
  });

  it("calls deleteBlog and navigates on confirm", async () => {
    mockDeleteBlog.mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderDeleteBlogButton(1);
    fireEvent.click(screen.getByText("I18N_Blog_Delete"));

    await waitFor(() => {
      expect(mockDeleteBlog).toHaveBeenCalledWith(1);
      expect(mockDeleteBlog).toHaveBeenCalledTimes(1);
    });
  });

  it("does not call deleteBlog when confirm is cancelled", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);

    renderDeleteBlogButton(1);
    fireEvent.click(screen.getByText("I18N_Blog_Delete"));

    expect(mockDeleteBlog).not.toHaveBeenCalled();
  });

  it("shows error alert when deleteBlog fails", async () => {
    mockDeleteBlog.mockRejectedValue(new Error("Network error"));
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderDeleteBlogButton(1);
    fireEvent.click(screen.getByText("I18N_Blog_Delete"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("I18N_Blog_Delete_Error");
    });
  });

  it("disables the button while deleting", async () => {
    let resolveDelete!: () => void;
    mockDeleteBlog.mockImplementation(
      () => new Promise<void>((resolve) => {
        resolveDelete = resolve;
      })
    );
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderDeleteBlogButton(1);
    const button = screen.getByText("I18N_Blog_Delete");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("I18N_Blog_Deleting")).toBeInTheDocument();
    });
    expect(screen.getByRole("button")).toBeDisabled();

    resolveDelete();

    await waitFor(() => {
      expect(screen.getByText("I18N_Blog_Delete")).toBeInTheDocument();
    });
  });
});