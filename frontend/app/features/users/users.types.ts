export interface IUserResponse {
  id: number;
  id_url: string;
  username: string;
  super_user: boolean;
  roles: string[];
  permissions: string[];
  created_at: string;
  last_login_at: string | null;
}

export interface IUser {
  id: number;
  username: string;
  isSuperUser: boolean;
  roles: string[];
  permissions: string[];
  createdAt: string;
  lastLoginAt: string | null;
}

export interface IUserCreateRequest {
  username: string;
  password: string;
}
