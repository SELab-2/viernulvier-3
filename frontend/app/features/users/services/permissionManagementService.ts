import type { AxiosInstance } from "axios";

import { createApiClient } from "~/shared/services/apiClient";

import { PERMISSIONS_API_PATH } from "../users.constants";
import type { IPermissionResponse } from "../users.types";

export async function listPermissions(apiClient: AxiosInstance = createApiClient()) {
  const response = await apiClient.get<IPermissionResponse[]>(PERMISSIONS_API_PATH);
  return response.data
    .map((permission) => permission.name)
    .sort((left, right) => left.localeCompare(right));
}
