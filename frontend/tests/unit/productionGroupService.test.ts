import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

import * as envModule from "~/shared/utils/env";
import { createApiClient } from "~/shared/services/apiClient";
import {
  createProductionGroup,
  deleteProductionGroup,
  editProductionGroup,
  getAllProductionGroups,
  getProductionGroupById,
} from "~/features/archive/services/productionGroupService";
import type { ProductionGroup } from "~/features/archive/types/productionGroupTypes";

describe("productionGroupService", () => {
  let mockAdapter: AxiosMockAdapter;

  const productionGroup: ProductionGroup = {
    id_url: "/api/v1/archive/production-groups/1",
    title: "Spring series",
    is_public_filter: true,
    production_id_urls: [
      "/api/v1/archive/productions/10",
      "/api/v1/archive/productions/11",
    ],
  };

  beforeEach(() => {
    vi.spyOn(envModule, "getEnv").mockReturnValue({
      API_BASE_URL: "http://localhost",
    });

    const apiClient = createApiClient();
    mockAdapter = new AxiosMockAdapter(apiClient);
    vi.spyOn(axios, "create").mockReturnValue(apiClient);
  });

  it("lists public production groups by default", async () => {
    mockAdapter
      .onGet("/api/v1/archive/production-groups?public_only=true")
      .reply(200, [productionGroup]);

    const result = await getAllProductionGroups();

    expect(result).toEqual([productionGroup]);
  });

  it("fetches all production groups when requested", async () => {
    mockAdapter
      .onGet("/api/v1/archive/production-groups?public_only=false")
      .reply(200, [productionGroup]);

    const result = await getAllProductionGroups(false);

    expect(result).toEqual([productionGroup]);
  });

  it("returns a production group by id", async () => {
    mockAdapter
      .onGet("/api/v1/archive/production-groups/1")
      .reply(200, productionGroup);

    const result = await getProductionGroupById(1);

    expect(result).toEqual(productionGroup);
  });

  it("creates a production group", async () => {
    const request = {
      title: "Spring series",
      is_public_filter: false,
      production_id_urls: ["/api/v1/archive/productions/10"],
    };

    mockAdapter.onPost("/api/v1/archive/production-groups").reply(201, {
      ...productionGroup,
      is_public_filter: false,
      production_id_urls: request.production_id_urls,
    });

    const result = await createProductionGroup(request);

    expect(result.is_public_filter).toBe(false);
    expect(result.production_id_urls).toEqual(request.production_id_urls);
  });

  it("updates a production group", async () => {
    mockAdapter.onPatch("/api/v1/archive/production-groups/1").reply(200, {
      ...productionGroup,
      title: "Updated spring series",
    });

    const result = await editProductionGroup(1, {
      title: "Updated spring series",
    });

    expect(result.title).toBe("Updated spring series");
  });

  it("deletes a production group", async () => {
    mockAdapter.onDelete("/api/v1/archive/production-groups/1").reply(204);

    await expect(deleteProductionGroup(1)).resolves.toBeUndefined();
  });
});
