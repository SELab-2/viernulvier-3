import type { AxiosInstance } from "axios";

import { createApiClient } from "~/shared/services/apiClient";

import { ROLES_API_PATH } from "../users.constants";
import type {
  IRole,
  IRoleCreateRequest,
  IRoleResponse,
  IRoleUpdateRequest,
} from "../users.types";

function sortNames(values: string[]) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function mapRole(response: IRoleResponse): IRole {
  const parts = response.id_url.split("/");
  return {
    id: parseInt(parts[parts.length - 1], 10),
    name: response.name,
    permissions: sortNames(response.permissions),
  };
}

export async function listRoles(apiClient: AxiosInstance = createApiClient()) {
  const response = await apiClient.get<IRoleResponse[]>(ROLES_API_PATH);
  return response.data
    .map(mapRole)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function createRole(
  payload: IRoleCreateRequest,
  apiClient: AxiosInstance = createApiClient()
) {
  const response = await apiClient.post<IRoleResponse>(ROLES_API_PATH, payload);
  return mapRole(response.data);
}

export async function updateRole(
  roleId: number,
  payload: IRoleUpdateRequest,
  apiClient: AxiosInstance = createApiClient()
) {
  const response = await apiClient.put<IRoleResponse>(
    `${ROLES_API_PATH}/${roleId}`,
    payload
  );
  return mapRole(response.data);
}

export async function deleteRole(
  roleId: number,
  apiClient: AxiosInstance = createApiClient()
) {
  await apiClient.delete(`${ROLES_API_PATH}/${roleId}`);
}
