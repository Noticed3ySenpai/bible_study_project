import { isSupabaseBackend } from "@/lib/config";
import { getDevUser, signInDev, signOutDev } from "./dev";
import {
  getSupabaseUser,
  signInWithEmailPassword,
  signOutSupabase,
  signUpWithEmailPassword,
} from "./supabase-auth";
import type { AppUser } from "./types";

export type { AppUser };

export async function getUser(): Promise<AppUser | null> {
  if (isSupabaseBackend()) {
    return getSupabaseUser();
  }
  return getDevUser();
}

export async function signUp(
  email: string,
  password: string
): Promise<{ user: AppUser | null; error: string | null }> {
  if (!isSupabaseBackend()) {
    return {
      user: null,
      error: "Account creation is only available with Supabase auth.",
    };
  }
  return signUpWithEmailPassword(email, password);
}

export async function signIn(
  credentials:
    | { email: string; password: string }
    | { username: string; password: string }
): Promise<{ user: AppUser | null; error: string | null }> {
  if (isSupabaseBackend()) {
    if (!("email" in credentials)) {
      return { user: null, error: "Email and password are required." };
    }
    if (!credentials.password) {
      return { user: null, error: "Email and password are required." };
    }
    return signInWithEmailPassword(credentials.email, credentials.password);
  }

  if (!("username" in credentials)) {
    return { user: null, error: "Username and password are required." };
  }
  const user = signInDev(credentials.username, credentials.password);
  if (!user) {
    return { user: null, error: "Invalid username or password." };
  }
  return { user, error: null };
}

export async function signOut(): Promise<void> {
  if (isSupabaseBackend()) {
    await signOutSupabase();
  } else {
    signOutDev();
  }
}

export function isDevAuth(): boolean {
  return !isSupabaseBackend();
}
