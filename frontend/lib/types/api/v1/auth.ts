export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    access_token_expires_in: number;
    refresh_token_expires_in: number;
}
