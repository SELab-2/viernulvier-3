export interface Pagination {
  next_cursor?: number;
  has_more: boolean;
}

export interface ProductionInfo {
  id_url: string;
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
  
  production_infos: ProductionInfo[];
  events: string[];
  tags: string[]; // ToDo: change after pr.
}

export interface ProductionList {
  productions: Production[];
  pagination: Pagination;
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
  tag_ids: number[];
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
  tag_ids?: number[];
  remove_languages?: string[]; 
}
