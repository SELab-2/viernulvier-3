import {
  getFromArchive,
  postToArchive,
  patchToArchive,
  deleteFromArchive,
} from "~/shared/services/sharedService";
import type { Event, EventCreate, EventUpdate, Price } from "../types/eventTypes";

export async function getEvent(eventId: number): Promise<Event> {
  return getFromArchive<Event>(`/events/${eventId}`);
}

export async function createEvent(eventData: EventCreate): Promise<Event> {
  return postToArchive<Event>("/events", eventData);
}

export async function updateEvent(
  eventId: number,
  eventData: EventUpdate
): Promise<Event> {
  return patchToArchive<Event>(`/events/${eventId}`, eventData);
}

export async function deleteEvent(eventId: number): Promise<void> {
  return deleteFromArchive(`/events/${eventId}`);
}

export async function getEventPrices(eventId: number): Promise<Price[]> {
  return getFromArchive<Price[]>(`/events/${eventId}/prices`);
}

export async function getEventPrice(eventId: number, priceId: number): Promise<Price> {
  return getFromArchive<Price>(`/events/${eventId}/prices/${priceId}`);
}
