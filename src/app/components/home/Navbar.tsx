"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    router.push("/");
  };

  return (
    <header className="fixed top-0 z-50 w-full border-b border-stone-200 bg-[#FDFBF7]/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl">
              <Image
                src="/images/yiyi_profile_photo.webp"
                alt="YiYi AI Logo"
                fill
                className="object-cover"
                sizes="40px"
                priority
              />
            </div>
            <span className="serif-font text-2xl font-bold tracking-tight text-[#8B5E3C]">
              YiYi AI
            </span>
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-stone-600 md:flex">
            <Link href="/service/create" className="transition-colors hover:text-[#8B5E3C]">
              Service
            </Link>
            <Link href="/pricing" className="transition-colors hover:text-[#8B5E3C]">
              Pricing
            </Link>
            <Link href="/showcase" className="transition-colors hover:text-[#8B5E3C]">
              Showcase
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {loading ? (
            <div className="text-sm text-stone-600">Loading...</div>
          ) : isAuthenticated && user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-[#8B5E3C] transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-[#8B5E3C] flex items-center justify-center text-white text-xs font-semibold">
                  {user.name
                    ? user.name.charAt(0).toUpperCase()
                    : user.email.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline">
                  {user.name || user.email}
                </span>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-stone-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-stone-100">
                    <p className="text-sm font-medium text-stone-800">
                      {user.name || "User"}
                    </p>
                    <p className="text-xs text-stone-500 truncate">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-stone-600 transition-colors hover:text-[#8B5E3C]"
              >
                Log In
              </Link>
              <Link
                href="/auth/register"
                className="transform rounded-full bg-[#8B5E3C] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:scale-105 hover:bg-opacity-90"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
