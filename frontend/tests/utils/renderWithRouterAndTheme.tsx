import { render } from "@testing-library/react";
import { AuthSessionProvider } from "~/features/auth";
import Navbar from "~/shared/components/Navbar";
import { createMemoryRouter, RouterProvider } from "react-router";
import { ThemeProvider } from "~/shared/components/ThemeContext";
import { vi } from "vitest";
import Home from "~/routes/home";
import Archive from "~/routes/archive";
import History from "~/routes/history";
import Blogs from "~/routes/blogs";
import Users from "~/routes/users";
import NotFound from "~/routes/not-found";

vi.mock("~/shared/hooks/useLocalizedPath", () => ({
  useLocalizedPath: () => (path: string) => path,
}));

export function renderWithRouterAndTheme({
  useRealHome = false,
  useRealArchive = false,
  useRealHistory = false,
  useRealBlogs = false,
  useRealUsers = false,
  useRealNotFound = false,
  initialPath = "/",
}) {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: !useRealHome ? (
          <>
            <Navbar />
            <div>TEST_HOME_PAGE</div>
          </>
        ) : (
          <Home />
        ),
      },
      {
        path: "/archive",
        element: !useRealArchive ? (
          <>
            <Navbar />
            <div>TEST_ARCHIVE_PAGE</div>
          </>
        ) : (
          <Archive />
        ),
      },
      {
        path: "/history",
        element: !useRealHistory ? (
          <>
            <Navbar />
            <div>TEST_HISTORY_PAGE</div>
          </>
        ) : (
          <History />
        ),
      },
      {
        path: "/blogs",
        element: !useRealBlogs ? (
          <>
            <Navbar />
            <div>TEST_BLOGS_PAGE</div>
          </>
        ) : (
          <Blogs />
        ),
      },
      {
        path: "/users",
        element: !useRealUsers ? (
          <>
            <Navbar />
            <div>TEST_USERS_PAGE</div>
          </>
        ) : (
          <Users />
        ),
      },
      {
        path: "*",
        element: !useRealNotFound ? (
          <>
            <Navbar />
            <div>TEST_NOT_FOUND_PAGE</div>
          </>
        ) : (
          <NotFound />
        ),
      },
    ],
    {
      initialEntries: [initialPath],
    }
  );

  return render(
    <AuthSessionProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </AuthSessionProvider>
  );
}
