import { AUTH_API_PATH } from "~/features/auth/auth.constants";

export const USERS_API_PATH = `${AUTH_API_PATH}/users`;

export const USER_PERMISSIONS = {
  read: "users:read",
} as const;
