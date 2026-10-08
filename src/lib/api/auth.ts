import { apiFetch } from '../api-client';
import type { AuthResponse, User } from '../types';

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export function register(payload: RegisterPayload): Promise<User> {
  return apiFetch<User>('/auth/register', { method: 'POST', body: payload });
}

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: payload });
}

export function me(token: string): Promise<User> {
  return apiFetch<User>('/auth/me', { token });
}
