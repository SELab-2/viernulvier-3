import {
  getFromArchive,
  postToArchive,
  patchToArchive,
  deleteFromArchive,
} from "~/shared/services/sharedService";
import type {
  Hall,
  HallResponse,
  HallUpdate,
} from "~/features/archive/types/hallTypes";

export async function getAllHalls(): Promise<HallResponse[]> {
  return getFromArchive<HallResponse[]>("/halls");
}

export async function getHall(hallId: number): Promise<HallResponse> {
  return getFromArchive<HallResponse>(`/halls/${hallId}`);
}

export async function createHall(hallData: Hall): Promise<HallResponse> {
  return postToArchive<HallResponse>("/halls", hallData);
}

export async function updateHall(
  hallId: number,
  hallData: HallUpdate
): Promise<HallResponse> {
  return patchToArchive<HallResponse>(`/halls/${hallId}`, hallData);
}

export async function deleteHall(hallId: number): Promise<void> {
  return deleteFromArchive(`/halls/${hallId}`);
}
