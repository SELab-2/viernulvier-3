import type { IdPaginationRequest } from "~/features/archive/types/paginationTypes";
import { createApiClient } from "~/shared/services/apiClient";
import { deleteFromArchive } from "~/shared/services/sharedService";
import type { MediaListResponse, MediaResponse } from "../types/mediaTypes";

const ARCHIVE_PATH: string = "/api/v1/archive";

export async function getMediaForBlog(
  blogId: number,
  params?: IdPaginationRequest,
  lang?: string
): Promise<MediaListResponse> {
  const apiClient = createApiClient(lang);

  const response = await apiClient.get<MediaListResponse>(
    `${ARCHIVE_PATH}/blogs/${blogId}/media/`,
    { params }
  );

  return response.data;
}

export async function uploadMediaForBlog(
  blogId: number,
  file: File
): Promise<MediaResponse> {
  const apiClient = createApiClient();

  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<MediaResponse>(
    `${ARCHIVE_PATH}/blogs/${blogId}/media/`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return response.data;
}

export async function deleteMediaForBlog(
  blogId: number,
  mediaId: number
): Promise<void> {
  return deleteFromArchive(`/blogs/${blogId}/media/${mediaId}`);
}
