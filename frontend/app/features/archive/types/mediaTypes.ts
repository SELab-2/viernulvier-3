import type { IdPaginationResponse } from "./paginationTypes";

export interface MediaItem {
  id_url: string;
  url: string;
  production_id_url: string | null;
  blog_id_url: string | null;
  content_type: string;
  uploaded_at: string;
}

export interface MediaList {
  media: MediaItem[];
  pagination: IdPaginationResponse;
}
