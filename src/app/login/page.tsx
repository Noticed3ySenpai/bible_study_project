"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getUser,
  isDevAuth,
  signIn,
  signOut,
  signUp,
  type AppUser,
} from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const devMode = isDevAuth();
  const [user, setUser] = useState<AppUser | null>(null);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  async function handleProdSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result =
      mode === "sign-up"
        ? await signUp(email, password)
        : await signIn({ email, password });

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.user) {
      router.push("/notes");
    }
  }

  async function handleDevSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signIn({ username, password });
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.user) {
      router.push("/notes");
    }
  }

  async function handleSignOut() {
    await signOut();
    setUser(null);
  }

  if (user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-bold text-stone-900">Account</h1>
        <p className="mt-2 text-stone-600">
          Signed in as {user.username ?? user.email ?? user.id}
        </p>
        {devMode && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Development mode — notes are stored locally in your browser.
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/notes")}
            className="min-h-11 rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
          >
            Go to Notes
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="min-h-11 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-stone-900">
        {devMode ? "Sign In" : mode === "sign-up" ? "Create Account" : "Sign In"}
      </h1>

      {devMode ? (
        <>
          <p className="mt-2 text-stone-600">
            Development mode — sign in with the local admin account.
          </p>
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Default credentials: <strong>admin</strong> / <strong>admin</strong>
          </p>
          <form onSubmit={handleDevSubmit} className="mt-8 space-y-4">
            <label className="block text-sm font-medium text-stone-700">
              Username
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full min-h-11 rounded-lg border border-stone-300 px-4 py-2 text-sm"
              />
            </label>
            <label className="block text-sm font-medium text-stone-700">
              Password
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full min-h-11 rounded-lg border border-stone-300 px-4 py-2 text-sm"
              />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-11 rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="mt-2 text-stone-600">
            {mode === "sign-up"
              ? "Create an account to save notes with Supabase."
              : "Sign in with your Supabase account."}
          </p>
          <div className="mt-6 flex gap-2 rounded-lg bg-stone-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("sign-in");
                setError(null);
              }}
              className={`flex-1 min-h-10 rounded-md px-3 text-sm font-medium ${
                mode === "sign-in"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-600"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("sign-up");
                setError(null);
              }}
              className={`flex-1 min-h-10 rounded-md px-3 text-sm font-medium ${
                mode === "sign-up"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-600"
              }`}
            >
              Create Account
            </button>
          </div>
          <form onSubmit={handleProdSubmit} className="mt-8 space-y-4">
            <label className="block text-sm font-medium text-stone-700">
              Email
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full min-h-11 rounded-lg border border-stone-300 px-4 py-2 text-sm"
              />
            </label>
            <label className="block text-sm font-medium text-stone-700">
              Password
              <input
                type="password"
                required
                autoComplete={
                  mode === "sign-up" ? "new-password" : "current-password"
                }
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full min-h-11 rounded-lg border border-stone-300 px-4 py-2 text-sm"
              />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-11 rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50"
            >
              {loading
                ? mode === "sign-up"
                  ? "Creating account…"
                  : "Signing in…"
                : mode === "sign-up"
                  ? "Create Account"
                  : "Sign In"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
