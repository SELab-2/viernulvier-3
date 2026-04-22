import {
  getByUrl,
  getFromArchive,
  postToArchive,
  patchToArchive,
  deleteFromArchive,
  patchByUrl,
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
    tag_ids?: string[];
    artists?: string[];
    production_name?: string;
    earliest_at?: string;
    latest_at?: string;
    sort_order?: string;
  }
): Promise<ProductionList> {
  const apiClient = createApiClient();

  const response = await apiClient.get<ProductionList>(`${ARCHIVE_PATH}/productions`, {
    params: {
      ...params,
      tag_ids: params?.tag_ids?.join(","),
      artists: params?.artists?.join(","),
    },
  });

  return response.data;
}

export async function getProduction(productionId: number): Promise<Production> {
  return getFromArchive<Production>(`/productions/${productionId}`);
}

export async function getProductionByUrl(productionUrl: string): Promise<Production> {
  return getByUrl<Production>(productionUrl);
}

export async function createProduction(
  productionData: ProductionCreate
): Promise<Production> {
  return postToArchive<Production>("/productions", productionData);
}

export async function updateProductionByUrl(
  production_url: string,
  productionData: ProductionUpdate
): Promise<Production> {
  return patchByUrl<Production>(production_url, productionData);
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
