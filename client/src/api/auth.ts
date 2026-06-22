import { api } from "./client";
import type { User } from "@/types";

export interface AuthResponse {
  token: string;
  user: User;
}

export async function login(email: string, password: string) {
  const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
  return data;
}

export async function register(email: string, password: string, name: string) {
  const { data } = await api.post<AuthResponse>("/auth/register", { email, password, name });
  return data;
}

export async function fetchMe() {
  const { data } = await api.get<{ user: User }>("/auth/me");
  return data.user;
}
