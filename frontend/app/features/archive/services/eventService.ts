import {
  getByUrl,
  getFromArchive,
  postToArchive,
  patchToArchive,
  deleteFromArchive,
  patchByUrl,
} from "~/shared/services/sharedService";
import type { Event, EventCreate, EventUpdate, Price } from "../types/eventTypes";

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

export async function updateEventByUrl(
  eventUrl: string,
  eventData: EventUpdate
): Promise<Event> {
  return patchByUrl<Event>(eventUrl, eventData);
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
