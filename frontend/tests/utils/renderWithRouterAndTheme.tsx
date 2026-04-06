import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import { ThemeProvider } from "~/shared/components/ThemeContext";
import Home from "~/routes/home";
import Archive from "~/routes/archive";
import History from "~/routes/history";

function Wrapper({
  initialPath = "/nl",
}: {
  children?: React.ReactNode;
  initialPath?: string;
}) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <ThemeProvider>
        <Routes>
          <Route path=":lang">
            <Route index element={<Home />} />
            <Route path="archive" element={<Archive />} />
            <Route path="history" element={<History />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </MemoryRouter>
  );
}

export function renderWithRouterAndTheme(options?: { route?: string }) {
  return render(<Wrapper initialPath={options?.route} />);
}