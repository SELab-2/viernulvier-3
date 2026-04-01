import {
  getFromArchive,
  getFromArchiveList,
  postToArchive,
  patchToArchive,
  deleteFromArchive,
} from "~/shared/services/sharedService";
import type { TagCreate, Tag, TagUpdate } from "../types/tagTypes";

const ENDPOINT = "/tags";

export async function getAllTags(): Promise<Tag[]> {
  return getFromArchiveList<Tag>(ENDPOINT);
}

export async function getTagById(id: number): Promise<Tag> {
  return getFromArchive<Tag>(`${ENDPOINT}/${id}`);
}

export async function createTag(request: TagCreate): Promise<Tag> {
  return postToArchive<Tag>(`${ENDPOINT}`, request);
}

export async function editTag(id: number, request: TagUpdate): Promise<Tag> {
  return patchToArchive<Tag>(`${ENDPOINT}/${id}`, request);
}

export async function deleteTag(id: number): Promise<void> {
  return deleteFromArchive(`${ENDPOINT}/${id}`);
}
