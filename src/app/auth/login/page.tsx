/**
 * Login page [module: auth / sign-in]
 * Renders the LoginForm (email/password) and RegisterForm side-by-side for returning and new users.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);

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
            <h1 className="text-2xl font-bold text-stone-800">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-stone-600 mt-2">
              {isLogin
                ? "Sign in to continue using YiYi AI"
                : "Create a new account to get started with YiYi AI"}
            </p>
          </div>

          {isLogin ? (
            <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  );
}
