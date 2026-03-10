/**
 * VibeDropdown [module: components / service]
 * Occasion/vibe selector dropdown used in DesignForm.
 * Lets the user pick a style context (casual, office, date night, etc.)
 * that guides the AI's outfit selection and formality matching.
 */
"use client";

import { useEffect, useRef, useState } from "react";

interface VibeDropdownProps {
  value: string;
  onChange: (val: string) => void;
}

const options = [
  { value: "", label: "Select Occasion" },
  { value: "date", label: "Date Night" },
  { value: "work", label: "Work / Office" },
  { value: "party", label: "Party / Event" },
  { value: "casual", label: "Casual Hangout" },
  { value: "formal", label: "Formal" },
  { value: "sport", label: "Sport / Active" },
];

const VibeDropdown = ({ value, onChange }: VibeDropdownProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentLabel = options.find((o) => o.value === value)?.label || options[0].label;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full h-12 px-4 rounded-lg border border-[#C9B89C] bg-white text-left text-base text-[#171412] focus:ring-[#8B4513] focus:border-[#8B4513] outline-none flex items-center justify-between gap-2"
      >
        <span>{currentLabel}</span>
        <span className="material-symbols-outlined text-[#7B5C49] text-lg">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-[#C9B89C] bg-white shadow-lg overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value || "empty"}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                value === opt.value
                  ? "bg-[#EDE0D4] text-[#8B4513] font-semibold"
                  : "text-[#171412] hover:bg-[#F5EDE0]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VibeDropdown;
