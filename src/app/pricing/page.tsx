import Footer from "@/app/components/home/Footer";
import Navbar from "@/app/components/home/Navbar";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <Navbar />
      <main className="pt-20">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="text-center mb-16">
            <p className="mb-4 text-sm font-bold uppercase tracking-widest text-[#8B5E3C]">
              Pricing
            </p>
            <h1 className="serif-font text-4xl md:text-5xl font-bold text-stone-900 mb-6">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Choose the plan that fits your needs. Start free, upgrade when you
              need more.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
              <h3 className="serif-font text-xl font-bold text-stone-900 mb-2">
                Free
              </h3>
              <p className="text-4xl font-bold text-[#8B5E3C] mb-6">
                $0
                <span className="text-base font-normal text-stone-500">
                  /month
                </span>
              </p>
              <ul className="space-y-4 mb-8 text-stone-600">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8B5E3C]">
                    check_circle
                  </span>
                  5 outfit generations per month
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8B5E3C]">
                    check_circle
                  </span>
                  Basic wardrobe (20 items)
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8B5E3C]">
                    check_circle
                  </span>
                  1 model photo
                </li>
              </ul>
              <Link
                href="/auth/register"
                className="block w-full text-center py-3 rounded-xl border-2 border-[#8B5E3C] text-[#8B5E3C] font-semibold hover:bg-[#8B5E3C] hover:text-white transition-colors"
              >
                Get Started
              </Link>
            </div>

            <div className="rounded-2xl border-2 border-[#8B5E3C] bg-white p-8 shadow-lg relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#8B5E3C] text-white text-sm font-bold">
                Popular
              </div>
              <h3 className="serif-font text-xl font-bold text-stone-900 mb-2">
                Pro
              </h3>
              <p className="text-4xl font-bold text-[#8B5E3C] mb-6">
                $9
                <span className="text-base font-normal text-stone-500">
                  /month
                </span>
              </p>
              <ul className="space-y-4 mb-8 text-stone-600">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8B5E3C]">
                    check_circle
                  </span>
                  Unlimited outfit generations
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8B5E3C]">
                    check_circle
                  </span>
                  Unlimited wardrobe items
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8B5E3C]">
                    check_circle
                  </span>
                  Up to 5 model photos
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8B5E3C]">
                    check_circle
                  </span>
                  Priority support
                </li>
              </ul>
              <Link
                href="/auth/register"
                className="block w-full text-center py-3 rounded-xl bg-[#8B5E3C] text-white font-semibold hover:bg-[#A0522D] transition-colors"
              >
                Start Free Trial
              </Link>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
              <h3 className="serif-font text-xl font-bold text-stone-900 mb-2">
                Enterprise
              </h3>
              <p className="text-4xl font-bold text-[#8B5E3C] mb-6">
                Custom
              </p>
              <ul className="space-y-4 mb-8 text-stone-600">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8B5E3C]">
                    check_circle
                  </span>
                  Everything in Pro
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8B5E3C]">
                    check_circle
                  </span>
                  API access
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8B5E3C]">
                    check_circle
                  </span>
                  Custom integrations
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8B5E3C]">
                    check_circle
                  </span>
                  Dedicated support
                </li>
              </ul>
              <Link
                href="#"
                className="block w-full text-center py-3 rounded-xl border-2 border-stone-300 text-stone-600 font-semibold hover:border-[#8B5E3C] hover:text-[#8B5E3C] transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
