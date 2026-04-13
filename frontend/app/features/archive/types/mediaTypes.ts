import type { PaginationRequest, PaginationResponse } from "./productionTypes";

export interface ProductionMedia {
  id_url: string;
  url: string;
  production: string;
  content_type: string;
  uploaded_at: string;
}

export interface ProductionMediaListResponse {
  media: ProductionMedia[];
  pagination: PaginationResponse;
}

export type ProductionMediaQuery = PaginationRequest;
