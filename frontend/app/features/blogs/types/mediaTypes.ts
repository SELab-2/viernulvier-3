import type { IdPaginationResponse } from "~/features/archive/types/paginationTypes";

export interface MediaResponse {
  id_url: string;
  url: string;
  production_id_url: string | null;
  blog_id_url: string | null;
  content_type: string;
  uploaded_at: string;
}

export interface MediaListResponse {
  media: MediaResponse[];
  pagination: IdPaginationResponse;
}
