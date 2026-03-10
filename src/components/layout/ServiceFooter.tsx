/**
 * ServiceFooter [module: components / layout]
 * Thin footer strip shared across all /service/* pages.
 * Includes the feedback button so users can submit ratings from any service page.
 */
"use client";

import FeedbackButton from "@/components/FeedbackButton";

const ServiceFooter = () => {
  return (
    <footer className="w-full border-t border-stone-200">
      <div className="py-4 flex items-center justify-between mx-4 sm:mx-40">
        <p className="text-[#857266] text-xs font-medium">
          © 2025 YiYi AI Fashion. Styled with love and AI magic.
        </p>
        <FeedbackButton page="service" />
      </div>
    </footer>
  );
};

export default ServiceFooter;
