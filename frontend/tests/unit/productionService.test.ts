import { describe, it, expect, beforeEach, vi } from "vitest";
import axios from "axios";
import * as envModule from "~/shared/utils/env";
import AxiosMockAdapter from "axios-mock-adapter";
import { createApiClient } from "~/shared/services/apiClient";

import {
  getProductionsPaginated,
  getProduction,
  createProduction,
  updateProduction,
  deleteProduction,
} from "~/features/archive/services/productionService";

import type { Event } from "~/features/archive/types/eventTypes";

import type {
  Production,
  ProductionInfo,
  ProductionList,
  ProductionCreate,
  ProductionUpdate
} from "~/features/archive/types/productionTypes";

import { setupLocalStorage } from "tests/globalSetup";

setupLocalStorage();

describe("productionService", () => {
  let mockAdapter: AxiosMockAdapter;

  const mockEvent1: Event = {
    id: "/api/v1/archive/events/1",
    production_id: "/api/v1/archive/productions/1",
    hall_id: "hall1",
    starts_at: "2026-04-29T19:00:00",
    ends_at: "2026-04-29T22:00:00",
    order_url: "https://example.com/order",
    price_ids: ["price1", "price2"],
    created_at: "2026-03-20T10:00:00",
    updated_at: "2026-03-20T10:00:00",
  };
  const mockEvent2: Event = {
    id: "/api/v1/archive/events/2",
    production_id: "/api/v1/archive/productions/1",
    hall_id: "hall3",
    starts_at: "2026-04-29T19:00:00",
    ends_at: "2026-04-29T22:00:00",
    order_url: "https://example.com/order",
    price_ids: ["price1", "price2"],
    created_at: "2026-03-29T14:00:00",
    updated_at: "2026-03-29T14:00:00",
  };
  const mockProductionInfo1NL: ProductionInfo = {
    prod_id: "/api/v1/archive/productions/1",
    language: "nl",
    title: "De Simpsons: Achter de schermen...",
    artist: "Homer Simpson",
    description: "Een kijkje achter de schermen van de wereldbenoemde serie: De Simpsons, rechtstreeks uit de ogen van Homer Simpson!",
  };
  const mockProductionInfo1EN: ProductionInfo = {
    prod_id: "/api/v1/archive/productions/1",
    language: "en",
    title: "De Simpsons: Behind the schenes...",
    artist: "Homer Simpson",
    description: "A peek behind the scenes of the world-famous series: The Simpsons, straight from Homer Simpson’s perspective!",
  };
  const mockProductionInfo2NL: ProductionInfo = {
    prod_id: "/api/v1/archive/productions/2",
    language: "nl",
    title: "Tegen beter weten in...",
    artist: "Jokke",
    description: "Jokke neeemt jullie mee naar het verleden met zijn oude nummers.",
  };
  const mockProduction1: Production = {
    id: "/api/v1/archive/productions/1",
    performer_type: "documentary",
    attendance_mode: "online",
    created_at: "2026-03-29T14:00:00",
    updated_at: "2026-03-29T14:00:00",
    
    production_infos: [mockProductionInfo1NL, mockProductionInfo1EN],
    events: ["/api/v1/archive/events/1", "/api/v1/archive/events/2"],
    tags: ["tag1, tag2"]
  };
  const mockProduction2: Production = {
    id: "/api/v1/archive/productions/2",
    performer_type: "singer",
    attendance_mode: "on stage",
    created_at: "2026-03-29T14:00:00",
    updated_at: "2026-03-29T14:00:00",
    
    production_infos: [mockProductionInfo2NL],
    events: ["/api/v1/archive/events/1", "/api/v1/archive/events/2"],
    tags: ["tag3"]
  };

  beforeEach(() => {
    vi.spyOn(envModule, "getEnv").mockReturnValue({
      API_BASE_URL: "http://localhost",
    });

    const apiClient = createApiClient();
    mockAdapter = new AxiosMockAdapter(apiClient);
    mockAdapter.onGet("/api/v1/archive/events/1").reply(200, mockEvent1);
    mockAdapter.onGet("/api/v1/archive/events/2").reply(200, mockEvent2);
    mockAdapter.onGet("/api/v1/archive/productions/1").reply(200, mockProduction1);
    mockAdapter.onGet("/api/v1/archive/productions/2").reply(200, mockProduction2);
    vi.spyOn(axios, "create").mockReturnValue(apiClient);
  });

  describe("getProduction", () => {
    it("returns a single production by id on success", async () => {
      
    });
  })
})