import { screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { renderWithRouterAndTheme } from "tests/utils/renderWithRouterAndTheme";
import userEvent from "@testing-library/user-event";
import * as productionService from "~/features/archive/services/productionService";
import { mockProductions } from "tests/mocks/productions.mock";
import type { Production } from "~/features/archive/types/productionTypes";

vi.mock("~/features/archive/services/productionService");

async function renderArchiveAndNavigate() {
  renderWithRouterAndTheme({ useRealArchive: true });
  const user = userEvent.setup();
  const links = screen.getAllByRole("link", { name: "I18N_Archive" });
  await user.click(links[0]);
}

function mockFetchedProductions(productions: Production[]) {
  vi.mocked(productionService.getProductionsPaginated).mockResolvedValue({
    productions: productions,
    pagination: { has_more: false },
  });
}

describe("Archive", () => {
  it("renders title", async () => {
    await renderArchiveAndNavigate();
    expect(screen.getByText("I18N_Archive_Title")).toBeInTheDocument();
  });
  it("renders filter side panel", async () => {
    await renderArchiveAndNavigate();
    expect(screen.getByText("filter.search")).toBeInTheDocument();
  });
  it("renders a fetched list of productions", async () => {
    mockFetchedProductions(mockProductions);
    await renderArchiveAndNavigate();

    for (const prod of mockProductions) {
      const exists = prod.production_infos.some(
        (info) => info.title && screen.queryByText(info.title)
      );

      expect(exists).toBe(true);
    }
  });
  describe("Result count", async () => {
    it("displays correct result count", async () => {
      mockFetchedProductions(mockProductions);
      await renderArchiveAndNavigate();
      expect(
        screen.getByText(`${mockProductions.length} archive.results`)
      ).toBeInTheDocument();
    });
    it("displays 'result' in singular when there is only a single result", async () => {
      mockFetchedProductions([mockProductions[0]]);
      await renderArchiveAndNavigate();
      expect(screen.getByText(`1 archive.result`)).toBeInTheDocument();
    });
  });

  it("shows no results text when 0 results", async () => {
    mockFetchedProductions([]);
    await renderArchiveAndNavigate();

    expect(screen.getByText("archive.no_results.header")).toBeInTheDocument();
    expect(screen.getByText("archive.no_results.subtext")).toBeInTheDocument();
    expect(screen.getByText("0 archive.results")).toBeInTheDocument();
  });
});
