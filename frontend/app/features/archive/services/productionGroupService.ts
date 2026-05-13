import {
  deleteFromArchive,
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
