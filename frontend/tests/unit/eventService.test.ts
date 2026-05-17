import { describe, it, expect, beforeEach, vi } from "vitest";
import axios from "axios";
import * as envModule from "~/shared/utils/env";
import AxiosMockAdapter from "axios-mock-adapter";
import { createApiClient } from "~/shared/services/apiClient";
import {
  getEvent,
  getEventByUrl,
  createEvent,
  updateEventByUrl,
  updateEvent,
  deleteEvent,
  getEventPrices,
  getEventPrice,
  getPriceByUrl,
  createPrice,
  updatePrice,
  updatePriceByUrl,
  deletePrice,
} from "~/features/archive/services/eventService";
import type {
  Event,
  EventCreate,
  EventUpdate,
  Price,
  PriceCreate,
  PriceUpdate,
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
        id_url: "1",
        production_id_url: "prod1",
        starts_at: "2026-03-20T19:00:00",
        ends_at: "2026-03-20T22:00:00",
        order_url: "https://example.com/order",
        price_urls: ["price1", "price2"],
        created_at: "2026-03-20T10:00:00",
        updated_at: "2026-03-20T10:00:00",
      };

      mockAdapter.onGet("/api/v1/archive/events/1").reply(200, mockEvent);

      const result = await getEvent(1);

      expect(result).toEqual(mockEvent);
      expect(result.id_url).toBe("1");
      expect(result.production_id_url).toBe("prod1");
    });

    it("throws when event is not found", async () => {
      mockAdapter.onGet("/api/v1/archive/events/999").reply(404);

      await expect(getEvent(999)).rejects.toThrow();
    });
  });

  describe("getEventByUrl", () => {
    it("returns a single event by full url on success", async () => {
      const eventUrl = "http://localhost/api/v1/archive/events/1";
      const mockEvent: Event = {
        id_url: eventUrl,
        production_id_url: "prod1",
        starts_at: "2026-03-20T19:00:00",
        ends_at: "2026-03-20T22:00:00",
        order_url: "https://example.com/order",
        price_urls: ["price1", "price2"],
        created_at: "2026-03-20T10:00:00",
        updated_at: "2026-03-20T10:00:00",
      };

      mockAdapter.onGet("/api/v1/archive/events/1").reply(200, mockEvent);

      const result = await getEventByUrl(eventUrl);

      expect(result).toEqual(mockEvent);
      expect(result.id_url).toBe(eventUrl);
    });

    it("throws when event by url is not found", async () => {
      const eventUrl = "http://localhost/api/v1/archive/events/999";

      mockAdapter.onGet("/api/v1/archive/events/999").reply(404);

      await expect(getEventByUrl(eventUrl)).rejects.toThrow();
    });
  });

  describe("createEvent", () => {
    it("creates a new event and returns it", async () => {
      const eventData: EventCreate = {
        production_id_url: "prod1",
        hall_id_url: "hall1",
        starts_at: "2026-03-20T19:00:00",
        ends_at: "2026-03-20T22:00:00",
        order_url: "https://example.com/order",
      };

      const mockResponse: Event = {
        id_url: "1",
        ...eventData,
        price_urls: [],
        created_at: "2026-03-20T10:00:00",
        updated_at: "2026-03-20T10:00:00",
      };

      mockAdapter.onPost("/api/v1/archive/events").reply(201, mockResponse);

      const result = await createEvent(eventData);

      expect(result).toEqual(mockResponse);
      expect(result.id_url).toBe("1");
    });

    it("throws when create request fails", async () => {
      const eventData: EventCreate = {
        production_id_url: "prod1",
        hall_id_url: "hall1",
      };

      mockAdapter.onPost("/api/v1/archive/events").reply(400);

      await expect(createEvent(eventData)).rejects.toThrow();
    });
  });

  describe("updateEventByUrl", () => {
    it("updates an event by full url and returns updated data", async () => {
      const eventUrl = "http://localhost/api/v1/archive/events/1";
      const eventData: EventUpdate = {
        starts_at: "2026-03-21T19:00:00",
        ends_at: "2026-03-21T22:00:00",
      };

      const mockResponse: Event = {
        id_url: eventUrl,
        production_id_url: "prod1",
        ...eventData,
        price_urls: ["price1"],
        created_at: "2026-03-20T10:00:00",
        updated_at: "2026-03-21T10:00:00",
      };

      mockAdapter.onPatch("/api/v1/archive/events/1").reply(200, mockResponse);

      const result = await updateEventByUrl(eventUrl, eventData);

      expect(result).toEqual(mockResponse);
      expect(result.starts_at).toBe("2026-03-21T19:00:00");
    });

    it("throws when update by url request fails", async () => {
      const eventUrl = "http://localhost/api/v1/archive/events/999";
      const eventData: EventUpdate = {
        starts_at: "2026-03-21T19:00:00",
      };

      mockAdapter.onPatch("/api/v1/archive/events/999").reply(404);

      await expect(updateEventByUrl(eventUrl, eventData)).rejects.toThrow();
    });
  });

  describe("updateEvent", () => {
    it("updates an event and returns updated data", async () => {
      const eventData: EventUpdate = {
        starts_at: "2026-03-21T19:00:00",
        ends_at: "2026-03-21T22:00:00",
      };

      const mockResponse: Event = {
        id_url: "1",
        production_id_url: "prod1",
        ...eventData,
        price_urls: ["price1"],
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
          id_url: "price1",
          amount: 25.0,
          available: 100,
          expires_at: "2026-03-20T23:59:59",
          created_at: "2026-03-20T10:00:00",
          updated_at: "2026-03-20T10:00:00",
        },
        {
          id_url: "price2",
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
        id_url: "1",
        amount: 25.0,
        available: 100,
        expires_at: "2026-03-20T23:59:59",
        created_at: "2026-03-20T10:00:00",
        updated_at: "2026-03-20T10:00:00",
      };

      mockAdapter.onGet("/api/v1/archive/events/1/prices/1").reply(200, mockPrice);

      const result = await getEventPrice(1, 1);

      expect(result).toEqual(mockPrice);
      expect(result.id_url).toBe("1");
      expect(result.amount).toBe(25.0);
    });

    it("throws when price is not found", async () => {
      mockAdapter.onGet("/api/v1/archive/events/1/prices/999").reply(404);

      await expect(getEventPrice(1, 999)).rejects.toThrow();
    });
  });

  describe("getPriceByUrl", () => {
    it("returns a single price by full url", async () => {
      const priceUrl = "http://localhost/api/v1/archive/events/1/prices/1";
      const mockPrice: Price = {
        id_url: priceUrl,
        amount: 25.0,
        available: 100,
        expires_at: "2026-03-20T23:59:59",
        created_at: "2026-03-20T10:00:00",
        updated_at: "2026-03-20T10:00:00",
      };

      mockAdapter.onGet("/api/v1/archive/events/1/prices/1").reply(200, mockPrice);

      const result = await getPriceByUrl(priceUrl);

      expect(result).toEqual(mockPrice);
      expect(result.id_url).toBe(priceUrl);
      expect(result.amount).toBe(25.0);
    });

    it("throws when price by url is not found", async () => {
      const priceUrl = "http://localhost/api/v1/archive/events/1/prices/999";

      mockAdapter.onGet("/api/v1/archive/events/1/prices/999").reply(404);

      await expect(getPriceByUrl(priceUrl)).rejects.toThrow();
    });
  });

  describe("createPrice", () => {
    it("creates a price for an event and returns it", async () => {
      const priceData: PriceCreate = { amount: 15.0, available: 100 };

      const mockResponse: Price = {
        id_url: "http://localhost/api/v1/archive/events/1/prices/1",
        amount: 15.0,
        available: 100,
        created_at: "2026-03-20T10:00:00",
        updated_at: "2026-03-20T10:00:00",
      };

      mockAdapter.onPost("/api/v1/archive/events/1/prices").reply(201, mockResponse);

      const result = await createPrice(1, priceData);

      expect(result).toEqual(mockResponse);
      expect(result.amount).toBe(15.0);
      expect(result.available).toBe(100);
    });

    it("creates a price with only amount", async () => {
      const priceData: PriceCreate = { amount: 20.0 };

      const mockResponse: Price = {
        id_url: "http://localhost/api/v1/archive/events/1/prices/2",
        amount: 20.0,
        created_at: "2026-03-20T10:00:00",
        updated_at: "2026-03-20T10:00:00",
      };

      mockAdapter.onPost("/api/v1/archive/events/1/prices").reply(201, mockResponse);

      const result = await createPrice(1, priceData);

      expect(result.amount).toBe(20.0);
      expect(result.available).toBeUndefined();
    });

    it("throws when create price request fails", async () => {
      const priceData: PriceCreate = { amount: 10.0 };

      mockAdapter.onPost("/api/v1/archive/events/999/prices").reply(404);

      await expect(createPrice(999, priceData)).rejects.toThrow();
    });
  });

  describe("updatePrice", () => {
    it("updates a price by event and price id", async () => {
      const priceData: PriceUpdate = { amount: 25.0, available: 75 };

      const mockResponse: Price = {
        id_url: "http://localhost/api/v1/archive/events/1/prices/1",
        amount: 25.0,
        available: 75,
        created_at: "2026-03-20T10:00:00",
        updated_at: "2026-03-21T10:00:00",
      };

      mockAdapter.onPatch("/api/v1/archive/events/1/prices/1").reply(200, mockResponse);

      const result = await updatePrice(1, 1, priceData);

      expect(result).toEqual(mockResponse);
      expect(result.amount).toBe(25.0);
      expect(result.available).toBe(75);
    });

    it("updates a price partially", async () => {
      const priceData: PriceUpdate = { amount: 30.0 };

      const mockResponse: Price = {
        id_url: "http://localhost/api/v1/archive/events/1/prices/1",
        amount: 30.0,
        available: 50,
        created_at: "2026-03-20T10:00:00",
        updated_at: "2026-03-21T10:00:00",
      };

      mockAdapter.onPatch("/api/v1/archive/events/1/prices/1").reply(200, mockResponse);

      const result = await updatePrice(1, 1, priceData);

      expect(result.amount).toBe(30.0);
      expect(result.available).toBe(50);
    });

    it("throws when update price request fails", async () => {
      const priceData: PriceUpdate = { amount: 20.0 };

      mockAdapter.onPatch("/api/v1/archive/events/1/prices/999").reply(404);

      await expect(updatePrice(1, 999, priceData)).rejects.toThrow();
    });
  });

  describe("updatePriceByUrl", () => {
    it("updates a price by full url", async () => {
      const priceUrl = "http://localhost/api/v1/archive/events/1/prices/1";
      const priceData: PriceUpdate = { amount: 35.0 };

      const mockResponse: Price = {
        id_url: priceUrl,
        amount: 35.0,
        available: 50,
        created_at: "2026-03-20T10:00:00",
        updated_at: "2026-03-21T10:00:00",
      };

      mockAdapter.onPatch("/api/v1/archive/events/1/prices/1").reply(200, mockResponse);

      const result = await updatePriceByUrl(priceUrl, priceData);

      expect(result).toEqual(mockResponse);
      expect(result.amount).toBe(35.0);
    });

    it("throws when update by url fails", async () => {
      const priceUrl = "http://localhost/api/v1/archive/events/1/prices/999";
      const priceData: PriceUpdate = { amount: 20.0 };

      mockAdapter.onPatch("/api/v1/archive/events/1/prices/999").reply(404);

      await expect(updatePriceByUrl(priceUrl, priceData)).rejects.toThrow();
    });
  });

  describe("deletePrice", () => {
    it("deletes a price successfully", async () => {
      mockAdapter.onDelete("/api/v1/archive/events/1/prices/1").reply(204);

      await expect(deletePrice(1, 1)).resolves.toBeUndefined();
    });

    it("throws when delete price request fails", async () => {
      mockAdapter.onDelete("/api/v1/archive/events/1/prices/999").reply(404);

      await expect(deletePrice(1, 999)).rejects.toThrow();
    });
  });
});
