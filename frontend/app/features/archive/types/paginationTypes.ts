export interface PaginationRequest<CursorT> {
  cursor?: CursorT;
  limit?: number;
}

export interface PaginationResponse<CursorT> {
  next_cursor?: CursorT;
  has_more: boolean;
  total_count: number;
}

export type IdPaginationRequest = PaginationRequest<number>;
export type IdPaginationResponse = PaginationResponse<number>;

export type JsonPaginationRequest = PaginationRequest<string>;
export type JsonPaginationResponse = PaginationResponse<string>;
