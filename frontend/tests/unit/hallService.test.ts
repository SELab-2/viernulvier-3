import { describe, it, expect, beforeEach, vi } from "vitest";
import axios from "axios";
import * as envModule from "~/shared/utils/env";
import AxiosMockAdapter from "axios-mock-adapter";
import { createApiClient } from "~/shared/services/apiClient";
import {
  getAllHalls,
  getHall,
  createHall,
  updateHall,
  deleteHall,
} from "~/features/archive/services/hallService";
import type {
  Hall,
  HallResponse,
  HallUpdate,
} from "~/features/archive/types/hallTypes";

describe("hallService", () => {
  let mockAdapter: AxiosMockAdapter;

  beforeEach(() => {
    vi.spyOn(envModule, "getEnv").mockReturnValue({
      API_URL: "http://localhost",
    });

    const apiClient = createApiClient();
    mockAdapter = new AxiosMockAdapter(apiClient);
    vi.spyOn(axios, "create").mockReturnValue(apiClient);
  });

  describe("getAllHalls", () => {
    it("returns all halls on success", async () => {
      const mockHalls: HallResponse[] = [
        { id: 1, name: "Hall A", address: "Street 1" },
        { id: 2, name: "Hall B", address: "Street 2" },
      ];

      mockAdapter.onGet("/api/v1/archive/halls").reply(200, mockHalls);

      const result = await getAllHalls();

      expect(result).toEqual(mockHalls);
      expect(result).toHaveLength(2);
    });

    it("throws when get request fails", async () => {
      mockAdapter.onGet("/api/v1/archive/halls").reply(500);

      await expect(getAllHalls()).rejects.toThrow();
    });
  });

  describe("getHall", () => {
    it("returns a single hall by id on success", async () => {
      const mockHall: HallResponse = {
        id: 1,
        name: "Hall A",
        address: "Street 1",
      };

      mockAdapter.onGet("/api/v1/archive/halls/1").reply(200, mockHall);

      const result = await getHall(1);

      expect(result).toEqual(mockHall);
      expect(result.id).toBe(1);
      expect(result.name).toBe("Hall A");
    });

    it("throws when hall is not found", async () => {
      mockAdapter.onGet("/api/v1/archive/halls/999").reply(404);

      await expect(getHall(999)).rejects.toThrow();
    });
  });

  describe("createHall", () => {
    it("creates a new hall and returns it with id", async () => {
      const hallData: Hall = {
        name: "New Hall",
        address: "New Street 1",
      };

      const mockResponse: HallResponse = {
        id: 3,
        ...hallData,
      };

      mockAdapter.onPost("/api/v1/archive/halls").reply(201, mockResponse);

      const result = await createHall(hallData);

      expect(result).toEqual(mockResponse);
      expect(result.id).toBe(3);
      expect(result.name).toBe("New Hall");
    });

    it("throws when create request fails", async () => {
      const hallData: Hall = {
        name: "New Hall",
        address: "New Street 1",
      };

      mockAdapter.onPost("/api/v1/archive/halls").reply(400);

      await expect(createHall(hallData)).rejects.toThrow();
    });
  });

  describe("updateHall", () => {
    it("updates a hall and returns updated data", async () => {
      const hallData: HallUpdate = {
        name: "Updated Hall",
        address: "Updated Street 1",
      };

      const mockResponse: HallResponse = {
        id: 1,
        name: "Updated Hall",
        address: "Updated Street 1",
      };

      mockAdapter.onPatch("/api/v1/archive/halls/1").reply(200, mockResponse);

      const result = await updateHall(1, hallData);

      expect(result).toEqual(mockResponse);
      expect(result.name).toBe("Updated Hall");
      expect(result.address).toBe("Updated Street 1");
    });

    it("throws when update request fails", async () => {
      const hallData: HallUpdate = {
        name: "Updated Hall",
        address: "Updated Street 1",
      };

      mockAdapter.onPatch("/api/v1/archive/halls/1").reply(400);

      await expect(updateHall(1, hallData)).rejects.toThrow();
    });
  });

  describe("deleteHall", () => {
    it("deletes a hall successfully", async () => {
      mockAdapter.onDelete("/api/v1/archive/halls/1").reply(204);

      await expect(deleteHall(1)).resolves.toBeUndefined();
    });

    it("throws when delete request fails", async () => {
      mockAdapter.onDelete("/api/v1/archive/halls/1").reply(404);

      await expect(deleteHall(1)).rejects.toThrow();
    });
  });
});
