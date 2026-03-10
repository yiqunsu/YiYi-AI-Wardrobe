/**
 * Update Password page [module: auth / update-password]
 * Step 2: User lands here via the Supabase reset email link.
 * Supabase automatically sets the session from the URL fragment before
 * this page renders (handled by the Supabase JS client onAuthStateChange).
 * User then enters and confirms their new password.
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/db/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase processes the #access_token fragment and fires SIGNED_IN
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setSessionReady(true);
      }
    });

    // Also check for an existing session (user might already be logged in)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);

      setDone(true);
      setTimeout(() => router.push("/dashboard"), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-[#f7f1e8] flex items-center justify-center">
        <p className="text-stone-500 text-sm">Verifying reset link...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f1e8] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-4">
              <span className="serif-font text-3xl font-bold text-[#8B5E3C]">YiYi AI</span>
            </Link>
            <h1 className="text-2xl font-bold text-stone-800">Set New Password</h1>
            <p className="text-stone-600 mt-2 text-sm">Choose a strong password for your account.</p>
          </div>

          {done ? (
            <div className="text-center py-4">
              <span
                className="material-symbols-outlined text-5xl text-emerald-500 mb-4 block"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              <h2 className="font-bold text-[#171412] text-lg mb-2">Password updated!</h2>
              <p className="text-stone-500 text-sm">Redirecting you to your dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-semibold text-stone-700">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-lg border border-stone-300 px-4 py-3 text-sm outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm" className="text-sm font-semibold text-stone-700">
                  Confirm new password
                </label>
                <input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  className={`w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2 transition-colors ${
                    confirm && confirm !== password
                      ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                      : "border-stone-300 focus:border-[#8B5E3C] focus:ring-[#8B5E3C]/20"
                  }`}
                />
                {confirm && confirm !== password && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !password || password !== confirm}
                className="w-full py-3 bg-[#8B4513] text-white font-bold rounded-xl hover:bg-[#A0522D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
