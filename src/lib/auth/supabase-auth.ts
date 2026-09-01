import { createClient } from "@/lib/supabase/client";
import type { AppUser } from "./types";

export async function getSupabaseUser(): Promise<AppUser | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email };
}

export async function signInWithEmail(email: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback?next=/notes`,
    },
  });
  return { error: error?.message ?? null };
}

export async function signOutSupabase(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}
