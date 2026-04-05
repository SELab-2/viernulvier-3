import { describe, it, expect, beforeEach, vi } from "vitest";
import axios from "axios";
import * as envModule from "~/shared/utils/env";
import AxiosMockAdapter from "axios-mock-adapter";
import { createApiClient } from "~/shared/services/apiClient";
import {
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventPrices,
  getEventPrice,
} from "~/features/archive/services/eventService";
import type {
  Event,
  EventCreate,
  EventUpdate,
  Price,
} from "~/features/archive/types/eventTypes";

describe("eventService", () => {
  let mockAdapter: AxiosMockAdapter;

  beforeEach(() => {
    vi.spyOn(envModule, "getEnv").mockReturnValue({
      API_BASE_URL: "http://localhost",
    });

    const apiClient = createApiClient();
    mockAdapter = new AxiosMockAdapter(apiClient);
    vi.spyOn(axios, "create").mockReturnValue(apiClient);
  });

  describe("getEvent", () => {
    it("returns a single event by id on success", async () => {
      const mockEvent: Event = {
        id: "1",
        production_id: "prod1",
        hall_id: "hall1",
        starts_at: "2026-03-20T19:00:00",
        ends_at: "2026-03-20T22:00:00",
        order_url: "https://example.com/order",
        price_ids: ["price1", "price2"],
        created_at: "2026-03-20T10:00:00",
        updated_at: "2026-03-20T10:00:00",
      };

      mockAdapter.onGet("/api/v1/archive/events/1").reply(200, mockEvent);

      const result = await getEvent(1);

      expect(result).toEqual(mockEvent);
      expect(result.id).toBe("1");
      expect(result.production_id).toBe("prod1");
    });

    it("throws when event is not found", async () => {
      mockAdapter.onGet("/api/v1/archive/events/999").reply(404);

      await expect(getEvent(999)).rejects.toThrow();
    });
  });

  describe("createEvent", () => {
    it("creates a new event and returns it", async () => {
      const eventData: EventCreate = {
        production_id: "prod1",
        hall_id: "hall1",
        starts_at: "2026-03-20T19:00:00",
        ends_at: "2026-03-20T22:00:00",
        order_url: "https://example.com/order",
      };

      const mockResponse: Event = {
        id: "1",
        ...eventData,
        price_ids: [],
        created_at: "2026-03-20T10:00:00",
        updated_at: "2026-03-20T10:00:00",
      };

      mockAdapter.onPost("/api/v1/archive/events").reply(201, mockResponse);

      const result = await createEvent(eventData);

      expect(result).toEqual(mockResponse);
      expect(result.id).toBe("1");
    });

    it("throws when create request fails", async () => {
      const eventData: EventCreate = {
        production_id: "prod1",
        hall_id: "hall1",
      };

      mockAdapter.onPost("/api/v1/archive/events").reply(400);

      await expect(createEvent(eventData)).rejects.toThrow();
    });
  });

  describe("updateEvent", () => {
    it("updates an event and returns updated data", async () => {
      const eventData: EventUpdate = {
        starts_at: "2026-03-21T19:00:00",
        ends_at: "2026-03-21T22:00:00",
      };

      const mockResponse: Event = {
        id: "1",
        production_id: "prod1",
        hall_id: "hall1",
        ...eventData,
        price_ids: ["price1"],
        created_at: "2026-03-20T10:00:00",
        updated_at: "2026-03-21T10:00:00",
      };

      mockAdapter.onPatch("/api/v1/archive/events/1").reply(200, mockResponse);

      const result = await updateEvent(1, eventData);

      expect(result).toEqual(mockResponse);
      expect(result.starts_at).toBe("2026-03-21T19:00:00");
    });

    it("throws when update request fails", async () => {
      const eventData: EventUpdate = {
        starts_at: "2026-03-21T19:00:00",
      };

      mockAdapter.onPatch("/api/v1/archive/events/1").reply(400);

      await expect(updateEvent(1, eventData)).rejects.toThrow();
    });
  });

  describe("deleteEvent", () => {
    it("deletes an event successfully", async () => {
      mockAdapter.onDelete("/api/v1/archive/events/1").reply(204);

      await expect(deleteEvent(1)).resolves.toBeUndefined();
    });

    it("throws when delete request fails", async () => {
      mockAdapter.onDelete("/api/v1/archive/events/1").reply(404);

      await expect(deleteEvent(1)).rejects.toThrow();
    });
  });

  describe("getEventPrices", () => {
    it("returns all prices for an event", async () => {
      const mockPrices: Price[] = [
        {
          id: "price1",
          amount: 25.0,
          available: 100,
          expires_at: "2026-03-20T23:59:59",
          created_at: "2026-03-20T10:00:00",
          updated_at: "2026-03-20T10:00:00",
        },
        {
          id: "price2",
          amount: 35.0,
          available: 50,
          expires_at: "2026-03-20T23:59:59",
          created_at: "2026-03-20T10:00:00",
          updated_at: "2026-03-20T10:00:00",
        },
      ];

      mockAdapter.onGet("/api/v1/archive/events/1/prices").reply(200, mockPrices);

      const result = await getEventPrices(1);

      expect(result).toEqual(mockPrices);
      expect(result).toHaveLength(2);
    });

    it("throws when get prices request fails", async () => {
      mockAdapter.onGet("/api/v1/archive/events/1/prices").reply(500);

      await expect(getEventPrices(1)).rejects.toThrow();
    });
  });

  describe("getEventPrice", () => {
    it("returns a single price for an event", async () => {
      const mockPrice: Price = {
        id: "1",
        amount: 25.0,
        available: 100,
        expires_at: "2026-03-20T23:59:59",
        created_at: "2026-03-20T10:00:00",
        updated_at: "2026-03-20T10:00:00",
      };

      mockAdapter.onGet("/api/v1/archive/events/1/prices/1").reply(200, mockPrice);

      const result = await getEventPrice(1, 1);

      expect(result).toEqual(mockPrice);
      expect(result.id).toBe("1");
      expect(result.amount).toBe(25.0);
    });

    it("throws when price is not found", async () => {
      mockAdapter.onGet("/api/v1/archive/events/1/prices/999").reply(404);

      await expect(getEventPrice(1, 999)).rejects.toThrow();
    });
  });
});
