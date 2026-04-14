import { deleteFromArchive } from "~/shared/services/sharedService";
import { createApiClient } from "~/shared/services/apiClient";
import type { PaginationRequest } from "../types/productionTypes";
import type { MediaItem, MediaList } from "../types/mediaTypes";

const ARCHIVE_PATH: string = "/api/v1/archive";

export async function getMediaForProduction(
  productionId: number,
  params?: PaginationRequest
): Promise<MediaList> {
  const apiClient = createApiClient();
  const response = await apiClient.get<MediaList>(
    `${ARCHIVE_PATH}/productions/${productionId}/media/`,
    { params }
  );
  return response.data;
}

