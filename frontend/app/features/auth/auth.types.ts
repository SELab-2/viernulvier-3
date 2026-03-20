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
