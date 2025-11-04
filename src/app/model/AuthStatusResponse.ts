export interface AuthStatusResponse {
  authenticated: boolean;
  userId?: number;
  username?: string;
  email?: string;
}
