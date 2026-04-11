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

import type { Tag } from "~/features/archive/types/tagTypes";

import type {
  Production,
  ProductionInfo,
  ProductionList,
  ProductionCreate,
  ProductionUpdate,
  PaginationResponse,
} from "~/features/archive/types/productionTypes";

describe("productionService", () => {
  let mockAdapter: AxiosMockAdapter;

  // Mock tags
  const tag1: Tag = {
    id: "/api/v1/archive/tags/1",
    names: [],
  };

  const tag2: Tag = {
    id: "/api/v1/archive/tags/2",
    names: [],
  };

  // Mock productions (+ info)
  const mockProductionInfo1NL: ProductionInfo = {
    prod_id: "/api/v1/archive/productions/1",
    language: "nl",
    title: "De Simpsons: Achter de schermen...",
    artist: "Homer Simpson",
    description:
      "Een kijkje achter de schermen van de wereldbenoemde serie: De Simpsons, rechtstreeks uit de ogen van Homer Simpson!",
  };

  const mockProductionInfo1EN: ProductionInfo = {
    prod_id: "/api/v1/archive/productions/1",
    language: "en",
    title: "De Simpsons: Behind the schenes...",
    artist: "Homer Simpson",
    description:
      "A peek behind the scenes of the world-famous series: The Simpsons, straight from Homer Simpson’s perspective!",
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
    tags: [tag1, tag2],
  };

  const mockProduction2: Production = {
    id: "/api/v1/archive/productions/2",
    performer_type: "singer",
    attendance_mode: "on stage",
    created_at: "2026-03-29T14:00:00",
    updated_at: "2026-03-29T14:00:00",

    production_infos: [mockProductionInfo2NL],
    events: ["/api/v1/archive/events/1", "/api/v1/archive/events/2"],
    tags: [tag2],
  };

  beforeEach(() => {
    vi.spyOn(envModule, "getEnv").mockReturnValue({
      API_BASE_URL: "http://localhost",
    });

    const apiClient = createApiClient();
    mockAdapter = new AxiosMockAdapter(apiClient);
    mockAdapter.onGet("/api/v1/archive/productions/1").reply(200, mockProduction1);
    mockAdapter.onGet("/api/v1/archive/productions/2").reply(200, mockProduction2);
    vi.spyOn(axios, "create").mockReturnValue(apiClient);
  });

  describe("getProductions", () => {
    it("returns productions list", async () => {
      const pagination: PaginationResponse = {
        has_more: false,
      };

      const mockProductionList: ProductionList = {
        productions: [mockProduction1, mockProduction2],
        pagination: pagination,
      };

      mockAdapter.onGet("/api/v1/archive/productions").reply(200, mockProductionList);
      const result = await getProductionsPaginated();

      expect(result.productions).toHaveLength(2);
      expect(result.pagination.has_more).toBe(false);
    });
  });

  describe("getProduction", () => {
    it("returns a single production by id on success", async () => {
      const result = await getProduction(1);

      expect(result).toBeDefined();

      expect(result.id).toBe(mockProduction1.id);
      expect(result.performer_type).toBe(mockProduction1.performer_type);
      expect(result.attendance_mode).toBe(mockProduction1.attendance_mode);

      expect(result.production_infos).toHaveLength(2);
      expect(result.production_infos).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ language: "nl" }),
          expect.objectContaining({ language: "en" }),
        ])
      );

      expect(result.events).toHaveLength(2);
      expect(result.events).toEqual(mockProduction1.events);
    });
  });

  describe("createProduction", () => {
    it("creates a new production and returns it", async () => {
      const production_info: ProductionInfo = {
        prod_id: "/api/v1/archive/productions/3",
        language: "en",
        title: "Rocking the Suburbs!",
        artist: "William Shatner",
      };
      const productionData: ProductionCreate = {
        performer_type: "singer",
        attendance_mode: "online",
        production_info: production_info,
        tag_ids: [1, 2],
      };

      const mockResponse: Production = {
        id: "/api/v1/archive/productions/3",
        production_infos: [production_info],
        events: [],
        tags: [tag1],
      };

      mockAdapter.onPost("/api/v1/archive/productions").reply(201, mockResponse);
      const result = await createProduction(productionData);
      expect(result).toEqual(mockResponse);
      expect(result.id).toBe("/api/v1/archive/productions/3");
    });

    it("throws when create request fails", async () => {
      const production_info: ProductionInfo = {
        prod_id: "/api/v1/archive/productions/3",
        language: "en",
        title: "Rocking the Suburbs!",
        artist: "William Shatner",
      };
      const productionData: ProductionCreate = {
        performer_type: "singer",
        attendance_mode: "online",
        production_info: production_info,
        tag_ids: [1, 2],
      };

      mockAdapter.onPost("/api/v1/archive/productions").reply(400);

      await expect(createProduction(productionData)).rejects.toThrow();
    });
  });
  describe("updateProduction", () => {
    it("updates a production and returns updated data", async () => {
      const productionUpdate: ProductionUpdate = {
        attendance_mode: "online",
      };

      const mockProduction2_updated: Production = {
        id: "/api/v1/archive/productions/2",
        performer_type: "singer",
        attendance_mode: "online",
        created_at: "2026-03-29T14:00:00",
        updated_at: "2026-03-29T14:00:00",

        production_infos: [mockProductionInfo2NL],
        events: ["/api/v1/archive/events/1", "/api/v1/archive/events/2"],
        tags: [tag1],
      };

      mockAdapter
        .onPatch("/api/v1/archive/productions/2")
        .reply(200, mockProduction2_updated);

      const result = await updateProduction(2, productionUpdate);

      expect(result).toEqual(mockProduction2_updated);
      expect(result.attendance_mode).toBe("online");
      expect(result.tags[0]["id"]).toBe("/api/v1/archive/tags/1");
    });

    it("throws when update request fails", async () => {
      const productionUpdate: ProductionUpdate = {
        attendance_mode: "online",
      };

      mockAdapter.onPatch("/api/v1/archive/productions/2").reply(400);
      await expect(updateProduction(1, productionUpdate)).rejects.toThrow();
    });
  });
  describe("deleteProduction", () => {
    it("deletes a production successfully", async () => {
      mockAdapter.onDelete("/api/v1/archive/productions/1").reply(204);

      await expect(deleteProduction(1)).resolves.toBeUndefined();
    });

    it("throws when delete request fails", async () => {
      mockAdapter.onDelete("/api/v1/archive/productions/1").reply(404);

      await expect(deleteProduction(1)).rejects.toThrow();
    });
  });
});
