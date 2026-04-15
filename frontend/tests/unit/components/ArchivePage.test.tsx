import { screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { renderWithRouterAndTheme } from "tests/utils/renderWithRouterAndTheme";
import userEvent from "@testing-library/user-event";
import { ArchiveSortOrder } from "~/features/archive/components/ProductionTimeline";

async function renderArchiveAndNavigate() {
  renderWithRouterAndTheme({ useRealArchive: true });
  const user = userEvent.setup();
  const links = screen.getAllByRole("link", { name: "I18N_Archive" });
  await user.click(links[0]);
}

// NOTE testing will be easier once productions are fetched from backend as right now productions are hardcoded
describe("ProductionTimeline", () => {
  it("renders title", async () => {
    await renderArchiveAndNavigate();
    expect(screen.getByText("I18N_Archive_Title")).toBeInTheDocument();
  });
  it("renders filter side panel", async () => {
    await renderArchiveAndNavigate();
    expect(screen.getByText("filter.search")).toBeInTheDocument();
  });
  it("renders a list of productions", async () => {
    await renderArchiveAndNavigate();
    // TODO (improve once non-hardcoded productions)
    expect(screen.getAllByText("Film Hoge Dichtheid #2")).toHaveLength(4); // Check if there are 4 productions with the name "Film Hoge Dichtheid #2" (4 because I copied the mocked productions into the archive page 4 times)
  });
  describe("Result count", async () => {
    it("displays correct result count", async () => {
      await renderArchiveAndNavigate();
      // TODO (improve once non-hardcoded productions)
      expect(screen.getByText("12 archive.results")).toBeInTheDocument();
    });
    it("uses correct form of result(s) depending on amount of results", async () => {
      await renderArchiveAndNavigate();
      // TODO (requires non-hardcoded productions)
    });
  });

  it("shows no results text when 0 results", async () => {
    await renderArchiveAndNavigate();
    // TODO (requires non-hardcoded productions)
  });

  it("displays months grouped per year", async () => {
    await renderArchiveAndNavigate();

    // NOTE test will require redoing when adding fetching
    const yearHeader = screen.getByText("2024");
    expect(yearHeader).toBeInTheDocument();
    const yearSection = yearHeader.parentElement!;

    expect(within(yearSection).getByText(/october/i)).toBeInTheDocument();

    expect(screen.getByText("2023")).toBeInTheDocument();
  });

  it("Groups productions with unknown start date together", async () => {
    await renderArchiveAndNavigate();
    expect(screen.getByText("archive.unknownDate")).toBeInTheDocument();
  });

  it("changes sorting order when changing sort order", async () => {
    await renderArchiveAndNavigate();
    const user = userEvent.setup();

    const select = screen.getByRole("combobox", { name: "sort-order" });

    expect(select).toHaveValue(ArchiveSortOrder.NewestFirst);

    let year2024 = screen.getByText("2024");
    let year2023 = screen.getByText("2023");
    expect(year2023).toBeInTheDocument();
    expect(year2024).toBeInTheDocument();
    expect(year2023.compareDocumentPosition(year2024)).toBe(
      Node.DOCUMENT_POSITION_PRECEDING
    );

    await user.selectOptions(select, ArchiveSortOrder.OldestFirst);

    expect(select).toHaveValue(ArchiveSortOrder.OldestFirst);

    year2023 = screen.getByText("2023");
    year2024 = screen.getByText("2024");
    expect(year2023).toBeInTheDocument();
    expect(year2024).toBeInTheDocument();
    expect(year2023.compareDocumentPosition(year2024)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });
});
