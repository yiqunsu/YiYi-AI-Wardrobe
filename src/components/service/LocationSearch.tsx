/**
 * LocationSearch [module: components / service]
 * Location search input that queries /api/locations/autocomplete as the user types,
 * then resolves the selected place to lat/lon via /api/locations/details.
 */
"use client";

import { useEffect, useRef, useState } from "react";

export interface LocationItem {
  label: string;
  lat: number;
  lon: number;
}

interface LocationSearchProps {
  value: string;
  onSelect: (item: LocationItem) => void;
}

interface Suggestion {
  placeId: string;
  label: string;
}

/**
 * 生成一个新的 session token（UUID），用于将多次 Autocomplete 请求和最终的 Place Details
 * 请求归为同一个计费会话，显著降低 API 成本。
 */
function newSessionToken(): string {
  return crypto.randomUUID();
}

const LocationSearch = ({ value, onSelect }: LocationSearchProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Session token 在整个输入周期内保持不变，用户选择后重置
  const sessionTokenRef = useRef<string>(newSessionToken());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/locations/autocomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: query,
          sessionToken: sessionTokenRef.current,
        }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { suggestions?: Suggestion[] };
      setSuggestions(data.suggestions ?? []);
      setOpen(true);
    } catch (err) {
      console.error("Location autocomplete error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = async (suggestion: Suggestion) => {
    setInputValue(suggestion.label);
    setOpen(false);

    // 用同一个 session token 请求 Place Details，完成后重置 token 开启新会话
    const currentToken = sessionTokenRef.current;
    sessionTokenRef.current = newSessionToken();

    try {
      const params = new URLSearchParams({
        placeId: suggestion.placeId,
        sessionToken: currentToken,
      });
      const res = await fetch(`/api/locations/details?${params.toString()}`);
      if (!res.ok) {
        // 降级：只传 label，不传坐标
        onSelect({ label: suggestion.label, lat: 0, lon: 0 });
        return;
      }
      const data = (await res.json()) as { label?: string; lat?: number | null; lon?: number | null };
      onSelect({
        label: data.label || suggestion.label,
        lat: data.lat ?? 0,
        lon: data.lon ?? 0,
      });
    } catch {
      onSelect({ label: suggestion.label, lat: 0, lon: 0 });
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex w-full items-stretch rounded-lg overflow-hidden border border-[#C9B89C] bg-white">
        <input
          className="flex w-full min-w-0 flex-1 border-none focus:ring-0 text-[#171412] h-12 placeholder:text-[#857266] px-4 text-base font-normal outline-none"
          placeholder="e.g., London, Paris, New York"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (inputValue.length >= 2 && suggestions.length > 0) setOpen(true);
          }}
        />
        <div className="bg-[#EDE0D4] flex items-center justify-center px-4 border-l border-[#C9B89C]">
          {loading ? (
            <span className="material-symbols-outlined text-[#7B5C49] animate-spin" style={{ fontSize: 20 }}>
              progress_activity
            </span>
          ) : (
            <span className="material-symbols-outlined text-[#7B5C49]">location_on</span>
          )}
        </div>
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-[#C9B89C] bg-white shadow-lg max-h-64 overflow-auto">
          {suggestions.map((item) => (
            <button
              key={item.placeId}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full text-left px-4 py-3 text-sm text-[#171412] hover:bg-[#F5EDE0] transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[#C9B89C]" style={{ fontSize: 16 }}>
                location_on
              </span>
              {item.label}
            </button>
          ))}
        </div>
      )}
      {open && !loading && suggestions.length === 0 && inputValue.length >= 2 && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-[#C9B89C] bg-white shadow-lg">
          <div className="px-4 py-3 text-sm text-[#857266]">No results found</div>
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
