export interface PaginationRequest {
  cursor?: number;
  limit?: number;
}

export interface PaginationResponse {
  next_cursor?: number;
  has_more: boolean;
}