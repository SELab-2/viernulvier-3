import { screen, within, render } from "@testing-library/react";
import { mockProductions } from "tests/mocks/productions.mock";
import { describe, it, expect } from "vitest";
import {
  ArchiveSortOrder,
  ProductionTimeline,
} from "~/features/archive/components/ProductionTimeline";

describe("ProductionTimeline", () => {
  it("displays all passed productions", () => {
    render(<ProductionTimeline productions={mockProductions} />);

    for (const prod of mockProductions) {
      const exists = prod.production_infos.some(
        (info) => info.title && screen.queryByText(info.title)
      );

      expect(exists).toBe(true);
    }
  });

  it("displays months grouped per year", async () => {
    render(<ProductionTimeline productions={mockProductions} />);

    // Check if we can find a year header
    const yearHeader = screen.getByText("2026");
    expect(yearHeader).toBeInTheDocument();
    const yearSection = yearHeader.parentElement!;

    // Check if the months of april and june are present in the year header (based off of the mock productions)
    expect(within(yearSection).getByText(/april/i)).toBeInTheDocument();
    expect(within(yearSection).getByText(/june/i)).toBeInTheDocument();

    // Check if there is another year header elsewhere
    expect(screen.getByText("2025")).toBeInTheDocument();
  });

  describe("unknown date header", () => {
    it("displays when a production's date is not known", () => {
      render(
        <ProductionTimeline
          productions={[
            ...mockProductions,
            {
              ...mockProductions[0],
              earliest_at: undefined,
              latest_at: undefined,
              events: [],
            },
          ]}
        />
      );

      expect(screen.getByText("archive.unknownDate")).toBeInTheDocument();
    });
    it("does not display when all production's dates are known", () => {
      render(<ProductionTimeline productions={mockProductions} />);
      expect(screen.queryByText("archive.unknownDate")).toBeNull();
    });
  });

  describe("sort order", () => {
    it("lists years in descending order when passing ArchiveSortOrder.NewestFirst", () => {
      render(
        <ProductionTimeline
          sortOrder={ArchiveSortOrder.NewestFirst}
          productions={mockProductions}
        />
      );

      const year2026 = screen.getByText("2026");
      const year2025 = screen.getByText("2025");
      expect(year2026).toBeInTheDocument();
      expect(year2025).toBeInTheDocument();
      expect(year2025.compareDocumentPosition(year2026)).toBe(
        Node.DOCUMENT_POSITION_PRECEDING
      );
    });

    it("lists years in ascending order when passing ArchiveSortOrder.OldestFirst", () => {
      render(
        <ProductionTimeline
          sortOrder={ArchiveSortOrder.OldestFirst}
          productions={mockProductions}
        />
      );

      const year2026 = screen.getByText("2026");
      const year2025 = screen.getByText("2025");
      expect(year2026).toBeInTheDocument();
      expect(year2025).toBeInTheDocument();
      expect(year2025.compareDocumentPosition(year2026)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING
      );
    });
  });
});
