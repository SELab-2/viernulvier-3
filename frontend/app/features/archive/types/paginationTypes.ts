export interface PaginationRequest {
  cursor?: string | number;
  limit?: number;
}

export interface PaginationResponse {
  next_cursor?: string | number;
  has_more: boolean;
  total_count: number;
}
