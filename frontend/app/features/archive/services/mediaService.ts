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

export async function uploadMedia(
  productionId: number,
  file: File
): Promise<MediaItem> {
  const apiClient = createApiClient();
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post<MediaItem>(
    `${ARCHIVE_PATH}/productions/${productionId}/media/`,
    formData
  );
  return response.data;
}

export async function deleteMedia(
  productionId: number,
  mediaId: number
): Promise<void> {
  return deleteFromArchive(`/productions/${productionId}/media/${mediaId}`);
}