import {
  deleteFromArchive,
  getByUrl,
  getFromArchive,
  getFromArchiveList,
  patchToArchive,
  postToArchive,
} from "~/shared/services/sharedService";
import type {
  ProductionGroup,
  ProductionGroupCreate,
  ProductionGroupUpdate,
} from "../types/productionGroupTypes";
import type { Production } from "../types/productionTypes";
import { createApiClient } from "~/shared/services/apiClient";

const ENDPOINT = "/production-groups";

export async function getAllProductionGroups(
  publicOnly = true
): Promise<ProductionGroup[]> {
  return getFromArchiveList<ProductionGroup>(
    `${ENDPOINT}?public_only=${publicOnly ? "true" : "false"}`
  );
}

export async function getProductionGroupById(id: number): Promise<ProductionGroup> {
  return getFromArchive<ProductionGroup>(`${ENDPOINT}/${id}`);
}

export async function getProductionGroupByUrl(url: string): Promise<ProductionGroup> {
  return getByUrl<ProductionGroup>(url);
}

export async function createProductionGroup(
  request: ProductionGroupCreate
): Promise<ProductionGroup> {
  return postToArchive<ProductionGroup>(ENDPOINT, request);
}

export async function editProductionGroup(
  id: number,
  request: ProductionGroupUpdate
): Promise<ProductionGroup> {
  return patchToArchive<ProductionGroup>(`${ENDPOINT}/${id}`, request);
}

export async function deleteProductionGroup(id: number): Promise<void> {
  return deleteFromArchive(`${ENDPOINT}/${id}`);
}

export async function getProductionsForGroup(
  prod_group: ProductionGroup
): Promise<Production[]> {
  try {
    const apiClient = createApiClient();
    const productionIdUrls = prod_group.production_id_urls;
    const productions = await Promise.all(
      productionIdUrls.map((url) =>
        apiClient.get<Production>(url).then((res) => res.data)
      )
    );

    return productions;
  } catch {
    return [];
  }
}
