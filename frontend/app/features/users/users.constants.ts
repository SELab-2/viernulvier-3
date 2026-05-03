import { AUTH_API_PATH } from "~/features/auth/auth.constants";

export const USERS_API_PATH = `${AUTH_API_PATH}/users`;
export const ROLES_API_PATH = `${AUTH_API_PATH}/roles`;

export const USER_PERMISSIONS = {
  read: "users:read",
  create: "users:create",
  delete: "users:delete",
} as const;
