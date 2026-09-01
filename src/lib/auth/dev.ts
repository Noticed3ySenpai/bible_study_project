import type { AppUser } from "./types";

const SESSION_KEY = "bible-study-dev-session";
const DEV_USER: AppUser = {
  id: "dev-admin",
  email: "admin@localhost",
  username: "admin",
};

export function getDevUser(): AppUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

export function signInDev(username: string, password: string): AppUser | null {
  if (username === "admin" && password === "admin") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(DEV_USER));
    return DEV_USER;
  }
  return null;
}

export function signOutDev(): void {
  localStorage.removeItem(SESSION_KEY);
}
