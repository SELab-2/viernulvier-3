export interface ILoginRequest {
  username: string;
  password: string;
}

export interface ILoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface IAccessTokenResponse {
  access_token: string;
  token_type: string;
}

export interface IAuthUserResponse {
  id: number;
  username: string;
  super_user: boolean;
  roles: string[];
  permissions: string[];
  created_at: string;
  last_login_at: string | null;
}

export interface IAuthUser {
  id: number;
  username: string;
  isSuperUser: boolean;
  roles: string[];
  permissions: string[];
  createdAt: string;
  lastLoginAt: string | null;
}

export interface IStoredAuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface IAuthSessionContextValue {
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: IAuthUser | null;
  login: (request: ILoginRequest) => Promise<IAuthUser>;
  logout: () => void;
  refreshSession: () => Promise<IAuthUser | null>;
}
