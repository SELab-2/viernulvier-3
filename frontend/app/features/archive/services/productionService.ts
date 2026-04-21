import {
  getFromArchive,
  postToArchive,
  patchToArchive,
  deleteFromArchive,
} from "~/shared/services/sharedService";
import type {
  Production,
  ProductionList,
  ProductionCreate,
  ProductionUpdate,
} from "../types/productionTypes";
import { createApiClient } from "~/shared/services/apiClient";
import type { PaginationRequest } from "../types/paginationTypes";

const ARCHIVE_PATH: string = "/api/v1/archive";

export async function getProductionsPaginated(
  params?: PaginationRequest & {
    tags?: number[];
    artists?: string[];
    production_name?: string;
    earliest_at?: string;
    latest_at?: string;
  }
): Promise<ProductionList> {
  const apiClient = createApiClient();

  const response = await apiClient.get<ProductionList>(`${ARCHIVE_PATH}/productions`, {
    params: {
      ...params,
      tags: params?.tags?.join(","),
      artists: params?.artists?.join(","),
    },
  });

  return response.data;
}

export async function getProduction(productionId: number): Promise<Production> {
  return getFromArchive<Production>(`/productions/${productionId}`);
}

export async function createProduction(
  productionData: ProductionCreate
): Promise<Production> {
  return postToArchive<Production>("/productions", productionData);
}

export async function updateProduction(
  productionId: number,
  productionData: ProductionUpdate
): Promise<Production> {
  return patchToArchive<Production>(`/productions/${productionId}`, productionData);
}

export async function deleteProduction(productionId: number): Promise<void> {
  return deleteFromArchive(`/productions/${productionId}`);
}
