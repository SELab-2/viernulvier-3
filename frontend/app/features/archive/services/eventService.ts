import {
  getFromArchive,
  postToArchive,
  patchToArchive,
  deleteFromArchive,
} from "~/shared/services/sharedService";
import type { Event, EventCreate, EventUpdate, Price } from "../types/eventTypes";

const ENDPOINT = "/events";

export async function getEvent(eventId: number): Promise<Event> {
  return getFromArchive<Event>(`${ENDPOINT}/${eventId}`);
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
