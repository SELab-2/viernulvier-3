import type { Hall } from "~/features/archive/types/hallTypes";

export interface Price {
  id_url: string;
  amount?: number;
  available?: number;
  expires_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Event {
  id_url: string;
  production_id_url: string;
  hall?: Hall;
  starts_at?: string;
  ends_at?: string;
  order_url?: string;
  price_urls: string[];
  created_at?: string;
  updated_at?: string;
}

export interface EventCreate {
  production_id_url: string;
  hall_id_url: string;
  starts_at?: string;
  ends_at?: string;
  order_url?: string;
}

export interface EventUpdate {
  hall_id_url?: string;
  starts_at?: string;
  ends_at?: string;
  order_url?: string;
}
