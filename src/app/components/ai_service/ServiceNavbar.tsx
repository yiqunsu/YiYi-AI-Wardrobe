"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import HeadBar from "./HeadBar";

const ServiceNavbar = () => {
  const { user, logout, loading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const getUserAvatar = () => {
    if (user?.email) {
      // 使用用户邮箱的首字母作为头像
      const initial = user.name
        ? user.name.charAt(0).toUpperCase()
        : user.email.charAt(0).toUpperCase();
      return (
        <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-[#8B4513] bg-[#8B4513] flex items-center justify-center text-white font-bold text-lg">
          {initial}
        </div>
      );
    }
    return (
      <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-[#8B4513] bg-[#8B4513]"></div>
    );
  };

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-stone-200 px-10 py-4 bg-[#FDFBF7]/80 backdrop-blur-md sticky top-0 z-50">
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
      </div>
      <div className="flex flex-1 justify-end gap-8">
        <HeadBar />
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="cursor-pointer"
          >
            {getUserAvatar()}
          </button>
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-stone-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-stone-100">
                <p className="text-sm font-medium text-stone-800">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-stone-500 truncate">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ServiceNavbar;
