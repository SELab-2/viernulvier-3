export interface ProductionInfo {
  id_url: string;
  language: string;
  title: string;
  supertitle: string;
  artist: string;
  tagline: string;
  teaser: string;
  description: string;
  info: string;
}

export interface Production {
  id_url: string;
  performer_type: string;
  attendance_mode: string;
  media_gallery_id: any; // Update after merge media pr.
  created_at: string;
  updated_at: string;
}

export interface EventCreate {
  production_id: string;
  hall_id: string;
  starts_at?: string;
  ends_at?: string;
  order_url?: string;
}

export interface EventUpdate {
  hall_id?: string;
  starts_at?: string;
  ends_at?: string;
  order_url?: string;
}
