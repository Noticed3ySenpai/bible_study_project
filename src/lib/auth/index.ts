import { isSupabaseBackend } from "@/lib/config";
import { getDevUser, signInDev, signOutDev } from "./dev";
import { getSupabaseUser, signInWithEmail, signOutSupabase } from "./supabase-auth";
import type { AppUser } from "./types";

export type { AppUser };

export async function getUser(): Promise<AppUser | null> {
  if (isSupabaseBackend()) {
    return getSupabaseUser();
  }
  return getDevUser();
}

export async function signIn(
  credentials: { email: string } | { username: string; password: string }
): Promise<{ user: AppUser | null; error: string | null; sent?: boolean }> {
  if (isSupabaseBackend()) {
    if (!("email" in credentials)) {
      return { user: null, error: "Email sign-in is required in production." };
    }
    const { error } = await signInWithEmail(credentials.email);
    return { user: null, error, sent: !error };
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
