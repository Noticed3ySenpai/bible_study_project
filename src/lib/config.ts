/** Use Supabase in production; local storage in development. */
export function isSupabaseBackend(): boolean {
  return process.env.NODE_ENV === "production";
}
