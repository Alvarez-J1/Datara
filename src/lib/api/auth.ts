import { apiRequest, setAuthToken, setAuthUser } from "@/lib/api/client";

export type UserRole = "USER" | "ADMIN";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type UpdateProfileRequest = {
  name: string;
  email: string;
};

export const login = async (request: LoginRequest): Promise<AuthResponse> => {
  const response = await apiRequest<AuthResponse>("/api/auth/login", {
    auth: false,
    body: request,
    method: "POST",
  });

  setAuthToken(response.token);
  setAuthUser(response.user);
  return response;
};

export const register = async (
  request: RegisterRequest
): Promise<AuthResponse> => {
  const response = await apiRequest<AuthResponse>("/api/auth/register", {
    auth: false,
    body: request,
    method: "POST",
  });

  setAuthToken(response.token);
  setAuthUser(response.user);
  return response;
};

export const getMe = async (): Promise<AuthResponse> => {
  const response = await apiRequest<AuthResponse>("/api/auth/me");
  setAuthUser(response.user);
  return response;
};

/**
 * Updates the signed-in user's name/email. The backend reissues a JWT
 * (its subject is the user's email), so the new token must replace the
 * stored one or the next request will fail authentication.
 */
export const updateProfile = async (
  request: UpdateProfileRequest
): Promise<AuthResponse> => {
  const response = await apiRequest<AuthResponse>("/api/auth/me", {
    body: request,
    method: "PATCH",
  });

  setAuthToken(response.token);
  setAuthUser(response.user);
  return response;
};
