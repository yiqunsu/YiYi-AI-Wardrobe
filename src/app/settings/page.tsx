/**
 * User settings page [module: app / account]
 * Protected page for managing account preferences, profile details, and notification settings.
 */
"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";

function ComingSoonBadge() {
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-[#EDE0D4] px-2.5 py-0.5 text-xs font-semibold text-[#8B5E3C]">
      Coming Soon
    </span>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f7f1e8]">
        <Navbar />
        <main className="pt-20">
          <div className="mx-auto max-w-3xl px-6 py-12">
            <div className="mb-10">
              <h1 className="serif-font text-3xl font-bold text-stone-800 mb-2">
                Account Settings
              </h1>
              <p className="text-stone-500">
                Manage your profile, subscription, and billing preferences.
              </p>
            </div>

            <div className="space-y-6">
              {/* ── Profile Info ────────────────────────────────────── */}
              <section className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                <div className="px-8 py-5 border-b border-stone-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8B5E3C]">person</span>
                  <h2 className="font-bold text-stone-800">Profile</h2>
                </div>
                <div className="px-8 py-6 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#8B5E3C] text-white text-xl font-bold shrink-0">
                      {user?.name
                        ? user.name.charAt(0).toUpperCase()
                        : user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-stone-800">{user?.name || "—"}</p>
                      <p className="text-sm text-stone-500">{user?.email}</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-stone-400 mb-1">
                        Display Name
                      </label>
                      <input
                        type="text"
                        defaultValue={user?.name || ""}
                        disabled
                        placeholder="Not set"
                        className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm text-stone-500 bg-stone-50 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-stone-400 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        defaultValue={user?.email || ""}
                        disabled
                        className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm text-stone-500 bg-stone-50 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      disabled
                      className="px-4 py-2 rounded-lg bg-stone-100 text-stone-400 text-sm font-semibold cursor-not-allowed"
                    >
                      Edit Profile
                    </button>
                    <ComingSoonBadge />
                  </div>
                </div>
              </section>

              {/* ── Subscription Plan ─────────────────────────────── */}
              <section className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                <div className="px-8 py-5 border-b border-stone-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8B5E3C]">workspace_premium</span>
                  <h2 className="font-bold text-stone-800">Subscription Plan</h2>
                  <ComingSoonBadge />
                </div>
                <div className="px-8 py-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#f7f1e8] border border-[#E2D4C4]">
                    <div>
                      <p className="font-bold text-stone-800">Free Plan</p>
                      <p className="text-sm text-stone-500 mt-0.5">
                        5 outfit generations / day · 50 wardrobe items
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600">
                      Current
                    </span>
                  </div>
                  <div className="mt-4 grid sm:grid-cols-2 gap-3 opacity-50 pointer-events-none select-none">
                    {[
                      { name: "Pro", price: "$9/mo", desc: "Unlimited generations · Unlimited wardrobe" },
                      { name: "Enterprise", price: "Custom", desc: "Everything in Pro + API access" },
                    ].map((plan) => (
                      <div
                        key={plan.name}
                        className="p-4 rounded-xl border-2 border-stone-200 bg-white"
                      >
                        <p className="font-bold text-stone-800">{plan.name}</p>
                        <p className="text-[#8B5E3C] font-semibold text-sm mt-0.5">{plan.price}</p>
                        <p className="text-xs text-stone-400 mt-1">{plan.desc}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-stone-400 mt-4 italic">
                    Paid plans are not yet available. Check back soon.
                  </p>
                </div>
              </section>

              {/* ── Payment Methods ────────────────────────────────── */}
              <section className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                <div className="px-8 py-5 border-b border-stone-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8B5E3C]">credit_card</span>
                  <h2 className="font-bold text-stone-800">Payment Methods</h2>
                  <ComingSoonBadge />
                </div>
                <div className="px-8 py-10 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#EDE0D4] text-[#8B5E3C] mb-4">
                    <span className="material-symbols-outlined text-3xl">credit_card</span>
                  </div>
                  <p className="text-stone-500 text-sm max-w-xs mx-auto">
                    Payment and billing management will be available once subscription plans launch.
                  </p>
                </div>
              </section>

              {/* ── Danger Zone ───────────────────────────────────── */}
              <section className="rounded-2xl border border-red-100 bg-white shadow-sm overflow-hidden">
                <div className="px-8 py-5 border-b border-red-50 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-400">warning</span>
                  <h2 className="font-bold text-stone-800">Danger Zone</h2>
                </div>
                <div className="px-8 py-6 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-stone-700 text-sm">Delete Account</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Permanently remove your account and all associated data.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled
                      className="px-4 py-2 rounded-lg border border-red-200 text-red-400 text-sm font-semibold cursor-not-allowed"
                    >
                      Delete Account
                    </button>
                    <ComingSoonBadge />
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
