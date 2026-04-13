import { createApiClient } from "~/shared/services/apiClient";
import type {
  ProductionMediaListResponse,
  ProductionMediaQuery,
} from "../types/mediaTypes";

const ARCHIVE_PATH = "/api/v1/archive";

export async function getMediaForProductionPaginated(
  productionId: number,
  params?: ProductionMediaQuery
): Promise<ProductionMediaListResponse> {
  const apiClient = createApiClient();

  const response = await apiClient.get<ProductionMediaListResponse>(
    `${ARCHIVE_PATH}/productions/${productionId}/media/`,
    {
      params,
    }
  );

  return response.data;
}
