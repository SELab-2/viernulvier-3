import type { Hall } from "~/features/archive/types/hallTypes";

export interface Price {
  id: string;
  amount?: number;
  available?: number;
  expires_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Event {
  id: string;
  production_id: string;
  hall_id: string;
  hall?: Hall;
  starts_at?: string;
  ends_at?: string;
  order_url?: string;
  price_ids: string[];
  price_objects?: Price[];
  created_at?: string;
  updated_at?: string;

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
