import { screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { renderWithRouterAndTheme } from "tests/utils/renderWithRouterAndTheme";
import userEvent from "@testing-library/user-event";
import * as productionService from "~/features/archive/services/productionService";
import { mockProductions } from "tests/mocks/productions.mock";
import type { Production } from "~/features/archive/types/productionTypes";
import { afterEach } from "node:test";

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

function expectEveryProductionVisible(productions: Production[]) {
  for (const prod of productions) {
    const exists = prod.production_infos.some(
      (info) => info.title && screen.queryByText(info.title)
    );

    expect(exists).toBe(true);
  }
}

describe("Archive", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

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

    expectEveryProductionVisible(mockProductions);
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

  describe("Show More", async () => {
    it("Shows a button when there is more data", async () => {
      vi.mocked(productionService.getProductionsPaginated).mockResolvedValueOnce({
        productions: [mockProductions[0]],
        pagination: { has_more: true, next_cursor: 100 },
      });
      await renderArchiveAndNavigate();

      expect(screen.getByText("archive.show_more")).toBeInTheDocument();
    });
    it("Does not shows a button when there is no more data", async () => {
      vi.mocked(productionService.getProductionsPaginated).mockResolvedValueOnce({
        productions: mockProductions,
        pagination: { has_more: false },
      });
      await renderArchiveAndNavigate();

      expect(screen.queryByText("archive.show_more")).toBeNull();
    });
    it("loads more productions when clicking show more", async () => {
      const user = userEvent.setup();
      vi.mocked(productionService.getProductionsPaginated)
        .mockResolvedValueOnce({
          productions: [mockProductions[0]],
          pagination: { has_more: true, next_cursor: 123 },
        })
        .mockResolvedValueOnce({
          productions: mockProductions.slice(1),
          pagination: { has_more: false },
        });
      await renderArchiveAndNavigate();

      // Before clicking show more
      expectEveryProductionVisible([mockProductions[0]]);
      expect(productionService.getProductionsPaginated).toHaveBeenNthCalledWith(
        1,
        expect.not.objectContaining({
          cursor: expect.anything(),
        })
      );

      await user.click(screen.getByText("archive.show_more"));

      // After clicking show more
      expectEveryProductionVisible(mockProductions.slice(1));

      expect(productionService.getProductionsPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: 123,
        })
      );
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
