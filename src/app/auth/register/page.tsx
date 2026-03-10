/**
 * Register page [module: auth / sign-up]
 * Renders the RegisterForm for new user account creation.
 */
"use client";

import Link from "next/link";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#f7f1e8] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-4">
              <span className="serif-font text-3xl font-bold text-[#8B5E3C]">
                YiYi AI
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-stone-800">Create Account</h1>
            <p className="text-stone-600 mt-2">
              Create a new account to get started with YiYi AI
            </p>
          </div>

          <RegisterForm
            onSwitchToLogin={() => {
              window.location.href = "/auth/login";
            }}
          />
        </div>
      </div>
    </div>
  );
}
