"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/service/create", label: "Today's Look" },
  { href: "/service/wardrobe", label: "My Wardrobe" },
  { href: "/service/collection", label: "My Models" },
  { href: "/service/history", label: "History" },
] as const;

const ServiceSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] shrink-0 border-r border-stone-200 bg-[#FDFBF7]/90 py-6">
      <nav className="flex flex-col gap-1 px-3">
        {navItems.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-[#8B5E3C] text-white"
                  : "text-[#171412] hover:bg-stone-200/80 hover:text-[#8B4513]"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default ServiceSidebar;
