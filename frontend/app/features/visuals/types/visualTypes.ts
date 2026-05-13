import type { IdPaginationResponse } from "~/features/archive/types/paginationTypes";

export type VisualType = string;

export interface VisualItem {
  url: string;
  id_url: string;
  content_type: string;
  title?: string;
  description?: string;
  visual_type?: VisualType;
  uploaded_at: string;
}

export interface VisualList {
  visuals: VisualItem[];
  pagination: IdPaginationResponse;
}

export interface VisualUploadParams {
  title?: string;
  description?: string;
  visual_type?: VisualType;
}
