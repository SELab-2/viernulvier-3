import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  EditableEventCard,
  type EventWithResolvedRelations,
} from "~/features/archive/components/EventCard";
import type { Hall } from "~/features/archive/types/hallTypes";
import { AuthSessionProvider } from "~/features/auth";

const mockHalls: Hall[] = [
  { id_url: "http://test/api/v1/archive/halls/1", name: "Main Hall" } as Hall,
  { id_url: "http://test/api/v1/archive/halls/2", name: "Small Hall" } as Hall,
];
const mockEvent: EventWithResolvedRelations = {
  id_url: "event-1",
  production_id_url: "prod-1",
  starts_at: "2026-05-10T10:00",
  ends_at: "2026-05-10T12:00",
  order_url: "",
  price_urls: [],
  resolvedHall: mockHalls[0],
  hall: mockHalls[0],
  resolvedPrices: [],
};

function renderCard(
  event: EventWithResolvedRelations,
  halls: Hall[] = mockHalls,
  onChange = vi.fn(),
  onDelete = vi.fn()
) {
  render(
    <AuthSessionProvider>
      <EditableEventCard
        event={event}
        halls={halls}
        onChange={onChange}
        onDelete={onDelete}
      />
    </AuthSessionProvider>
  );
}

describe("EditableEventCard", () => {
  it("renders with initial values", () => {
    renderCard(mockEvent);
    expect(screen.getByDisplayValue("Main Hall")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-05-10T10:00")).toBeInTheDocument();
  });

  it("calls onChange when the start date is updated", () => {
    const onChange = vi.fn();
    renderCard(mockEvent, mockHalls, onChange);

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

  it("filters and selects a hall from the dropdown", () => {
    const onChange = vi.fn();
    renderCard(mockEvent, mockHalls, onChange);

    const input = screen.getByPlaceholderText(/PlaceLabel/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Small" } });

    const option = screen.getByText("Small Hall");
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
    renderCard(invalidEvent);
    const startInput = screen.getByLabelText(/start.*label/i);
    expect(startInput).toHaveClass("border-red-500");
  });
});
