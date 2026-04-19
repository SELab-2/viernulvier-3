import type { AxiosInstance } from "axios";

import { createApiClient } from "~/shared/services/apiClient";
import { parseResourceId } from "~/shared/utils/resourceId";

import { USERS_API_PATH } from "../users.constants";
import type { IUser, IUserCreateRequest, IUserResponse } from "../users.types";

function mapUser(response: IUserResponse): IUser {
  return {
    id: parseResourceId(response.id_url),
    username: response.username,
    isSuperUser: response.super_user,
    roles: response.roles,
    permissions: response.permissions,
    createdAt: response.created_at,
    lastLoginAt: response.last_login_at,
  };
}

export async function listUsers(apiClient: AxiosInstance = createApiClient()) {
  const response = await apiClient.get<IUserResponse[]>(USERS_API_PATH);
  return response.data.map(mapUser);
}

export async function createUser(
  payload: IUserCreateRequest,
  apiClient: AxiosInstance = createApiClient()
) {
  const response = await apiClient.post<IUserResponse>(USERS_API_PATH, payload);
  return mapUser(response.data);
}
