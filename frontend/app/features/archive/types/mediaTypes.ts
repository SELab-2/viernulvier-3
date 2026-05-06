import type { IdPaginationResponse } from "./paginationTypes";

export interface MediaItem {
  id: number;
  production_id: number;
  filename: string;
  content_type: string;
  url: string;
  created_at?: string;
  updated_at?: string;
}

export interface MediaList {
  media: MediaItem[];
  pagination: IdPaginationResponse;
}
