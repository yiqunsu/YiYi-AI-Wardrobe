/**
 * Reset Password page [module: auth / reset-password]
 * Step 1: User enters their email address.
 * Calls supabase.auth.resetPasswordForEmail() which sends a magic link.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/db/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/update-password`,
        }
      );

      if (resetError) throw new Error(resetError.message);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f1e8] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-4">
              <span className="serif-font text-3xl font-bold text-[#8B5E3C]">YiYi AI</span>
            </Link>
            <h1 className="text-2xl font-bold text-stone-800">Reset Password</h1>
            <p className="text-stone-600 mt-2 text-sm">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          {sent ? (
            <div className="text-center py-4">
              <span className="material-symbols-outlined text-5xl text-emerald-500 mb-4 block"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                mark_email_read
              </span>
              <h2 className="font-bold text-[#171412] text-lg mb-2">Check your email</h2>
              <p className="text-stone-600 text-sm mb-6">
                We sent a password reset link to <strong>{email}</strong>.
                The link expires in 1 hour.
              </p>
              <Link
                href="/auth/login"
                className="text-[#8B5E3C] font-semibold text-sm hover:underline"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-semibold text-stone-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-stone-300 px-4 py-3 text-sm outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3 bg-[#8B4513] text-white font-bold rounded-xl hover:bg-[#A0522D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <p className="text-center text-sm text-stone-500">
                Remember your password?{" "}
                <Link href="/auth/login" className="text-[#8B5E3C] font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
