export interface ProductionGroup {
  id_url: string;
  title: string;
  is_public_filter: boolean;
  production_id_urls: string[];
}

export interface ProductionGroupCreate {
  title: string;
  is_public_filter?: boolean;
  production_id_urls?: string[];
}

export interface ProductionGroupUpdate {
  title?: string;
  is_public_filter?: boolean;
  production_id_urls?: string[];
}
