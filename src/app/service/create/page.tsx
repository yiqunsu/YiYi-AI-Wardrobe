"use client";

import { useState, useEffect, useCallback } from "react";
import ServiceMain from "@/app/components/ai_service/ServiceMain";
import { supabase } from "@/lib/supabase/client";

// 加载中依次循环展示的步骤提示
const LOADING_STEPS = [
  "Checking the weather...",
  "Browsing your wardrobe...",
  "Putting together the perfect outfit...",
  "Generating your look...",
];

export default function ServicePage() {
  const [formData, setFormData] = useState({
    location: "",
    locationLat: null as number | null,
    locationLon: null as number | null,
    date: new Date(),
    occasion: "",
    modelId: "",
    additionalNotes: "",
  });

  const [generatedOutfit, setGeneratedOutfit] = useState<{
    image: string | null;
    message: string;
    selectedItemIds: string[];
  } | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 设置页面背景色
  useEffect(() => {
    const originalBg = document.body.style.background;
    document.body.style.background = "#f7f1e8";
    return () => {
      document.body.style.background = originalBg;
    };
  }, []);

  // 加载中：循环切换步骤提示
  useEffect(() => {
    if (!isGenerating) {
      setGeneratingStep("");
      return;
    }
    let idx = 0;
    setGeneratingStep(LOADING_STEPS[0]);
    const timer = setInterval(() => {
      idx = (idx + 1) % LOADING_STEPS.length;
      setGeneratingStep(LOADING_STEPS[idx]);
    }, 4000);
    return () => clearInterval(timer);
  }, [isGenerating]);

  const handleFormChange = useCallback((field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedOutfit(null);

    try {
      // 获取当前用户 session token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError("Please log in to generate an outfit.");
        return;
      }

      const res = await fetch("/api/outfit/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          lat: formData.locationLat,
          lon: formData.locationLon,
          date: formData.date.toISOString(),
          location: formData.location,
          occasion: formData.occasion,
          modelId: formData.modelId || null,
          additionalNotes: formData.additionalNotes,
        }),
      });

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errData.error ?? `Server error (${res.status})`);
      }

      const data = (await res.json()) as {
        imageUrl: string | null;
        message: string;
        selectedItemIds: string[];
      };

      setGeneratedOutfit({
        image: data.imageUrl,
        message: data.message,
        selectedItemIds: data.selectedItemIds ?? [],
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ServiceMain
      formData={formData}
      generatedOutfit={generatedOutfit}
      isGenerating={isGenerating}
      generatingStep={generatingStep}
      error={error}
      onFormChange={handleFormChange}
      onGenerate={handleGenerate}
    />
  );
}
