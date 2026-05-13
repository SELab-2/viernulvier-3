import { deleteFromArchive } from "~/shared/services/sharedService";
import { createApiClient } from "~/shared/services/apiClient";
import type { IdPaginationRequest } from "~/features/archive/types/paginationTypes";
import type {
  VisualItem,
  VisualList,
  VisualType,
  VisualUploadParams,
} from "../types/visualTypes";

const ARCHIVE_PATH: string = "/api/v1/archive";

export async function getVisuals(
  params?: IdPaginationRequest & { visual_type?: VisualType }
): Promise<VisualList> {
  const apiClient = createApiClient();
  const response = await apiClient.get<VisualList>(`${ARCHIVE_PATH}/visuals/`, {
    params,
  });
  return response.data;
}

export async function getVisualById(visualId: number): Promise<VisualItem> {
  const apiClient = createApiClient();
  const response = await apiClient.get<VisualItem>(
    `${ARCHIVE_PATH}/visuals/${visualId}`
  );
  return response.data;
}

export async function getVisualTypes(): Promise<VisualType[]> {
  const apiClient = createApiClient();
  const response = await apiClient.get<VisualType[]>(`${ARCHIVE_PATH}/visuals/types`);
  return response.data;
}

export async function uploadVisual(
  file: File,
  uploadParams?: VisualUploadParams
): Promise<VisualItem> {
  const apiClient = createApiClient();
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post<VisualItem>(
    `${ARCHIVE_PATH}/visuals/`,
    formData,
    { params: uploadParams }
  );
  return response.data;
}

export async function deleteVisual(visualId: number): Promise<void> {
  return deleteFromArchive(`/visuals/${visualId}`);
}
