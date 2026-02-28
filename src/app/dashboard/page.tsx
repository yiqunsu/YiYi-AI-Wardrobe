"use client";

import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import { useAuth } from "@/app/contexts/AuthContext";
import Link from "next/link";
import Navbar from "@/app/components/home/Navbar";
import Footer from "@/app/components/home/Footer";

const quickLinks = [
  {
    href: "/service/create",
    label: "Today's Look",
    icon: "auto_fix_high",
    description: "Generate your outfit",
  },
  {
    href: "/service/wardrobe",
    label: "My Wardrobe",
    icon: "checkroom",
    description: "Manage your clothes",
  },
  {
    href: "/service/collection",
    label: "My Models",
    icon: "person_search",
    description: "Model photos",
  },
  {
    href: "/service/history",
    label: "History",
    icon: "history",
    description: "Past outfits",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f7f1e8]">
        <Navbar />
        <main className="pt-20">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8">
            <h1 className="serif-font text-3xl font-bold text-stone-800 mb-2">
              Welcome back, {user?.name || user?.email?.split("@")[0]}!
            </h1>
            <p className="text-stone-600">
              Your personal YiYi AI dashboard.
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md hover:border-[#8B5E3C]/50 transition-all"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#EDE0D4] text-[#8B5E3C] group-hover:bg-[#8B5E3C] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-2xl">
                    {link.icon}
                  </span>
                </div>
                <h3 className="font-bold text-stone-800">{link.label}</h3>
                <p className="text-sm text-stone-500">{link.description}</p>
              </Link>
            ))}
          </div>

          {/* User Info & Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
              <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8B5E3C]">
                  person
                </span>
                Account Info
              </h3>
              <div className="space-y-3 text-stone-600">
                <p className="flex items-center gap-2">
                  <span className="text-stone-400">Email:</span>
                  {user?.email}
                </p>
                {user?.name && (
                  <p className="flex items-center gap-2">
                    <span className="text-stone-400">Name:</span>
                    {user.name}
                  </p>
                )}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
              <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8B5E3C]">
                  settings
                </span>
                Settings
              </h3>
              <p className="text-stone-600 mb-4">
                Manage your account and preferences.
              </p>
              <Link
                href="#"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#C9B89C] text-[#171412] font-medium hover:bg-[#EDE0D4] transition-colors"
              >
                Account Settings
                <span className="material-symbols-outlined text-lg">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </div>
        </main>
      </div>
      <Footer />
    </ProtectedRoute>
  );
}
