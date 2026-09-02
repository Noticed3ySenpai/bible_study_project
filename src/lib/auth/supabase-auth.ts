import { createClient } from "@/lib/supabase/client";
import type { AppUser } from "./types";

export async function getSupabaseUser(): Promise<AppUser | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email };
}

export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<{ user: AppUser | null; error: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    return { user: null, error: error.message };
  }
  if (!data.user) {
    return { user: null, error: "Sign in failed." };
  }
  return {
    user: { id: data.user.id, email: data.user.email ?? undefined },
    error: null,
  };
}

export async function signUpWithEmailPassword(
  email: string,
  password: string
): Promise<{ user: AppUser | null; error: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return { user: null, error: error.message };
  }
  if (!data.user) {
    return { user: null, error: "Sign up failed." };
  }
  if (!data.session) {
    return {
      user: null,
      error: "Check your email to confirm your account before signing in.",
    };
  }
  return {
    user: { id: data.user.id, email: data.user.email ?? undefined },
    error: null,
  };
}

export async function signOutSupabase(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}
