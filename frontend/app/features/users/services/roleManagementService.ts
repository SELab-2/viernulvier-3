import type { AxiosInstance } from "axios";

import { createApiClient } from "~/shared/services/apiClient";

import { ROLES_API_PATH } from "../users.constants";
import type { IRole, IRoleCreateRequest, IRoleResponse } from "../users.types";

function mapRole(response: IRoleResponse): IRole {
  const parts = response.id_url.split("/");
  return {
    id: parseInt(parts[parts.length - 1], 10),
    name: response.name,
    permissions: response.permissions,
  };
}

export async function listRoles(apiClient: AxiosInstance = createApiClient()) {
  const response = await apiClient.get<IRoleResponse[]>(ROLES_API_PATH);
  return response.data.map(mapRole);
}

export async function createRole(
  payload: IRoleCreateRequest,
  apiClient: AxiosInstance = createApiClient()
) {
  const response = await apiClient.post<IRoleResponse>(ROLES_API_PATH, payload);
  return mapRole(response.data);
}

export async function deleteRole(
  roleId: number,
  apiClient: AxiosInstance = createApiClient()
) {
  await apiClient.delete(`${ROLES_API_PATH}/${roleId}`);
}
