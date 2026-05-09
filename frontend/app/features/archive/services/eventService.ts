import {
  getByUrl,
  getFromArchive,
  postToArchive,
  patchToArchive,
  patchByUrl,
  deleteFromArchive,
} from "~/shared/services/sharedService";
import type {
  Event,
  EventCreate,
  EventUpdate,
  Price,
  PriceCreate,
  PriceUpdate,
} from "../types/eventTypes";

const ENDPOINT = "/events";

export async function getEvent(eventId: number): Promise<Event> {
  return getFromArchive<Event>(`${ENDPOINT}/${eventId}`);
}

export async function getEventByUrl(eventUrl: string): Promise<Event> {
  return getByUrl<Event>(eventUrl);
}

export async function createEvent(eventData: EventCreate): Promise<Event> {
  return postToArchive<Event>(ENDPOINT, eventData);
}

export async function updateEvent(
  eventId: number,
  eventData: EventUpdate
): Promise<Event> {
  return patchToArchive<Event>(`${ENDPOINT}/${eventId}`, eventData);
}

export async function deleteEvent(eventId: number): Promise<void> {
  return deleteFromArchive(`${ENDPOINT}/${eventId}`);
}

export async function getEventPrices(eventId: number): Promise<Price[]> {
  return getFromArchive<Price[]>(`${ENDPOINT}/${eventId}/prices`);
}

export async function getEventPrice(eventId: number, priceId: number): Promise<Price> {
  return getFromArchive<Price>(`${ENDPOINT}/${eventId}/prices/${priceId}`);
}

export async function getPriceByUrl(priceUrl: string): Promise<Price> {
  return getByUrl<Price>(priceUrl);
}

export async function createPrice(
  eventId: number,
  priceData: PriceCreate
): Promise<Price> {
  return postToArchive<Price>(`${ENDPOINT}/${eventId}/prices`, priceData);
}

export async function updatePrice(
  eventId: number,
  priceId: number,
  priceData: PriceUpdate
): Promise<Price> {
  return patchToArchive<Price>(
    `${ENDPOINT}/${eventId}/prices/${priceId}`,
    priceData
  );
}

export async function updatePriceByUrl(
  priceUrl: string,
  priceData: PriceUpdate
): Promise<Price> {
  return patchByUrl<Price>(priceUrl, priceData);
}

export async function deletePrice(eventId: number, priceId: number): Promise<void> {
  return deleteFromArchive(`${ENDPOINT}/${eventId}/prices/${priceId}`);
}
