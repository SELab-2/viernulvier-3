import {
  getByUrl,
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

export async function getHallByUrl(hallUrl: string): Promise<Hall> {
  return getByUrl<Hall>(hallUrl);
}

export async function getHallByName(name: string): Promise<Hall> {
  const allHalls = await getAllHalls();

  // Search for a hall with the correct name.
  const hall = allHalls.find((hall) => hall.name.toLowerCase() === name.toLowerCase());

  if (!hall) {
    throw new Error(`Hall with name "${name}" not found`);
  }

  return hall;
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
