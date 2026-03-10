/**
 * HeadBar [module: components / service]
 * Top action bar displayed within service pages, showing the page title
 * and optional icon-button actions.
 */
"use client";

import Link from "next/link";

const HeadBar = () => {
  return (
    <div className="flex items-center gap-4">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#171412] hover:bg-[#EDE0D4] transition-colors"
      >
        <span className="material-symbols-outlined text-lg">dashboard</span>
        <span className="hidden sm:inline">Dashboard</span>
      </Link>
      <Link
        href="/service/wardrobe"
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#171412] hover:bg-[#EDE0D4] transition-colors"
      >
        <span className="material-symbols-outlined text-lg">checkroom</span>
        <span className="hidden sm:inline">Wardrobe</span>
      </Link>
      <Link
        href="/service/history"
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#171412] hover:bg-[#EDE0D4] transition-colors"
      >
        <span className="material-symbols-outlined text-lg">history</span>
        <span className="hidden sm:inline">History</span>
      </Link>
    </div>
  );
};

export default HeadBar;
