import {
  getFromArchive,
  postToArchive,
  patchToArchive,
  deleteFromArchive,
} from "~/shared/services/sharedService";
import type { Hall, HallUpdate, HallCreate } from "~/features/archive/types/hallTypes";

export async function getAllHalls(): Promise<Hall[]> {
  return getFromArchive<Hall[]>("/halls");
}

export async function getHall(hallId: number): Promise<Hall> {
  return getFromArchive<Hall>(`/halls/${hallId}`);
}

export async function createHall(hallData: HallCreate): Promise<Hall> {
  return postToArchive<Hall>("/halls", hallData);
}

export async function updateHall(hallId: number, hallData: HallUpdate): Promise<Hall> {
  return patchToArchive<Hall>(`/halls/${hallId}`, hallData);
}

export async function deleteHall(hallId: number): Promise<void> {
  return deleteFromArchive(`/halls/${hallId}`);
}
