import {
  getFromArchive,
  getFromArchiveList,
  postToArchive,
  patchToArchive,
  deleteFromArchive,
} from "~/shared/services/sharedService";
import type { ICreateResource, IResource, IUpdateResource } from "../resource.types";

const ENDPOINT = "/resource";

export async function getResourceList(limit?: number): Promise<IResource[]> {
  return getFromArchiveList<IResource>(ENDPOINT, limit ? { limit } : undefined);
}

export async function getResourceById(id: number): Promise<IResource> {
  return getFromArchive<IResource>(`${ENDPOINT}/${id}`);
}

export async function createResource(request: ICreateResource): Promise<IResource> {
  return postToArchive<IResource>(`${ENDPOINT}`, request);
}

export async function editResource(id: number, request: IUpdateResource): Promise<IResource> {
  return patchToArchive<IResource>(`${ENDPOINT}/${id}`, request);
}

export async function deleteResource(id: number): Promise<void> {
  return deleteFromArchive(`${ENDPOINT}/${id}`);
}
