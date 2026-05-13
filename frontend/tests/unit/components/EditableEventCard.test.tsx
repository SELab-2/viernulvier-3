import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import EditableEventCard from "~/features/archive/components/EditableEventCard";
import { type EventWithResolvedRelations } from "~/features/archive/components/EventCard";
import type { Hall } from "~/features/archive/types/hallTypes";
import { AuthSessionProvider } from "~/features/auth";

const mockHalls: Hall[] = [
  {
    id_url: "http://test/api/v1/archive/halls/1",
    names: [
      { language: "en", name: "Main Hall" },
      { language: "nl", name: "Hoofdhal" },
    ],
  },
  {
    id_url: "http://test/api/v1/archive/halls/2",
    names: [
      { language: "en", name: "Small Hall" },
      { language: "nl", name: "Kleine Hal" },
    ],
  },
];
const mockEvent: EventWithResolvedRelations = {
  id_url: "http://test/v1/archive/events/1",
  production_id_url: "http://test/v1/archive/productions/1",
  starts_at: "2026-05-10T10:00",
  ends_at: "2026-05-10T12:00",
  order_url: "",
  price_urls: [],
  resolvedHall: mockHalls[0],
  hall: mockHalls[0],
  resolvedPrices: [],
};

function renderCard({
  event = mockEvent,
  halls = mockHalls,
  language = "nl",
  onChange = vi.fn(),
  onDelete = vi.fn(),
}: {
  event?: EventWithResolvedRelations;
  halls?: Hall[];
  language?: string;
  onChange?: (updated: EventWithResolvedRelations) => void;
  onDelete?: () => void;
}) {
  render(
    <AuthSessionProvider>
      <EditableEventCard
        event={event}
        halls={halls}
        preferredLanguage={language}
        onChange={onChange}
        onDelete={onDelete}
      />
    </AuthSessionProvider>
  );
}

describe("EditableEventCard", () => {
  it("renders with initial values", () => {
    renderCard({ event: mockEvent, halls: mockHalls });
    expect(screen.getByDisplayValue("Hoofdhal")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-05-10T10:00")).toBeInTheDocument();
  });

  it("calls onChange when the start date is updated", () => {
    const onChange = vi.fn();
    renderCard({ onChange });

    const input = screen.getByLabelText(/start.*label/i);
    fireEvent.change(input, {
      target: { value: "2026-05-11T10:00" },
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        starts_at: "2026-05-11T10:00",
      })
    );
  });

  it("filters and selects a hall from the dropdown", async () => {
    const onChange = vi.fn();
    renderCard({ onChange });

    const input = screen.getByPlaceholderText(/PlaceLabel/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Klein" } });

    await waitFor(() => {
      expect(screen.getByText("Kleine Hal")).toBeInTheDocument();
    });

    const option = screen.getByText("Kleine Hal");
    fireEvent.mouseDown(option);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        resolvedHall: mockHalls[1],
      })
    );
  });

  it("shows validation error if start date is after end date", () => {
    const invalidEvent = {
      ...mockEvent,
      starts_at: "2026-05-12T10:00",
      ends_at: "2026-05-10T10:00",
    };
    renderCard({ event: invalidEvent });
    const startInput = screen.getByLabelText(/start.*label/i);
    expect(startInput).toHaveClass("border-red-500");
  });

  describe("Hall inputs", () => {
    it("clears the hall when an invalid hall name is entered", async () => {
      const onChange = vi.fn();
      renderCard({ onChange });

      const input = screen.getByPlaceholderText(/PlaceLabel/i);

      fireEvent.change(input, {
        target: { value: "Nonexistent Hall" },
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            hall: undefined,
            resolvedHall: undefined,
          })
        );
      });

      expect(input).toHaveClass("border-red-500");
    });

    it("clears the hall when the input is emptied", async () => {
      const onChange = vi.fn();
      renderCard({ onChange });

      const input = screen.getByPlaceholderText(/PlaceLabel/i);

      fireEvent.change(input, {
        target: { value: "" },
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            hall: undefined,
            resolvedHall: undefined,
          })
        );
      });
    });
  });
  describe("language", () => {
    it("renders the hall name in the preferred language nl", () => {
      renderCard({ language: "nl" });
      expect(screen.getByDisplayValue("Hoofdhal")).toBeInTheDocument();
    });
    it("renders the hall name in the preferred language en", () => {
      renderCard({ language: "en" });
      expect(screen.getByDisplayValue("Main Hall")).toBeInTheDocument();
    });
  });
});
