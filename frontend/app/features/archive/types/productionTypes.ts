import type { Tag } from "./tagTypes";
import type { PaginationResponse } from "./paginationTypes";

export interface ProductionInfo {
  production_id_url: string;
  language: string;

  title?: string;
  supertitle?: string;
  artist?: string;
  tagline?: string;
  teaser?: string;
  description?: string;
  info?: string;
}

export interface Production {
  id_url: string;

  performer_type?: string;
  attendance_mode?: string;
  media_gallery_id?: number; // Maybe update after merge media pr.
  created_at?: string;
  updated_at?: string;

  earliest_at?: string;
  latest_at?: string;

  production_infos: ProductionInfo[];
  event_id_urls: string[];
  tags: Tag[];
}

export interface ProductionList {
  productions: Production[];
  pagination: PaginationResponse;
}

export interface ProductionInfoCreate {
  language: string;

  title?: string;
  supertitle?: string;
  artist?: string;
  tagline?: string;
  teaser?: string;
  description?: string;
  info?: string;
}

export interface ProductionCreate {
  performer_type?: string;
  attendance_mode?: string;
  media_gallery_id?: number; // Maybe update after merge media pr.

  production_info: ProductionInfoCreate;
  tag_id_urls: string[];
}

export interface ProductionInfoUpdate {
  language: string;

  title?: string;
  supertitle?: string;
  artist?: string;
  tagline?: string;
  teaser?: string;
  description?: string;
  info?: string;
}

export interface ProductionUpdate {
  performer_type?: string;
  attendance_mode?: string;
  media_gallery_id?: number; // Maybe update after merge media pr.

  production_infos?: ProductionInfoUpdate[];
  tag_id_urls?: string[];
  remove_languages?: string[];
}
