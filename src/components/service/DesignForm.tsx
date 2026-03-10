/**
 * DesignForm [module: components / service]
 * Main outfit design input form. Collects: occasion date (DatePicker),
 * location (LocationSearch), vibe/style (VibeDropdown), and model photo selection.
 * Submits to the outfit generation API and passes results to MagicMirror.
 */
"use client";

import { useEffect, useMemo, useRef } from "react";
import VibeDropdown from "./VibeDropdown";
import LocationSearch, { LocationItem } from "./LocationSearch";
import DatePicker from "./DatePicker";
import { useModels } from "@/contexts/ModelsContext";

interface DesignFormProps {
  formData: {
    location: string;
    locationLat: number | null;
    locationLon: number | null;
    date: Date;
    occasion: string;
    modelId: string;
    additionalNotes: string;
  };
  onFormChange: (field: string, value: any) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const DesignForm = ({
  formData,
  onFormChange,
  onGenerate,
  isGenerating,
}: DesignFormProps) => {
  const { models, getDefaultModelId, fetchModels } = useModels();
  const selectedModelId = formData.modelId || "";

  const sortedModels = useMemo(
    () =>
      [...models].sort((a, b) => {
        if (a.isDefault) return -1;
        if (b.isDefault) return 1;
        if (a.isSystemDefault) return -1;
        if (b.isSystemDefault) return 1;
        return 0;
      }),
    [models]
  );

  useEffect(() => {
    if (sortedModels.length > 0 && !selectedModelId) {
      onFormChange("modelId", getDefaultModelId() ?? sortedModels[0].id);
    }
  }, [sortedModels, selectedModelId, getDefaultModelId, onFormChange]);

  const refreshingRef = useRef(false);
  const handleImageError = () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    fetchModels().finally(() => {
      refreshingRef.current = false;
    });
  };

  const handleModelSelect = (modelId: string) => {
    onFormChange("modelId", modelId);
  };

  return (
    <div className="flex-1 w-full bg-[#EDE0D4] p-8 rounded-xl border border-[#C9B89C] shadow-sm flex flex-col h-full">
      <div className="flex flex-col gap-6 flex-1">
        {/* 地点输入 */}
        <label className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-base font-bold text-[#171412]">
            <span className="material-symbols-outlined text-[#8B4513]">map</span>
            Where are we going?
          </span>
          <LocationSearch
            value={formData.location}
            onSelect={(item: LocationItem) => {
              onFormChange("location", item.label);
              onFormChange("locationLat", item.lat);
              onFormChange("locationLon", item.lon);
            }}
          />
        </label>

        {/* 日期和氛围 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 日期选择器 */}
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-base font-bold text-[#171412]">
              <span className="material-symbols-outlined text-[#a05222]">
                calendar_month
              </span>
              When is it?
            </span>
            <DatePicker
              selectedDate={formData.date}
              onDateChange={(date) => onFormChange("date", date)}
            />
          </div>

          {/* 氛围选择 */}
          <div className="flex flex-col gap-2 relative">
            <span className="flex items-center gap-2 text-base font-bold text-[#171412]">
              <span className="material-symbols-outlined text-[#a05222]">celebration</span>
              What's the vibe?
            </span>
            {/* 自定义下拉组件 */}
            <VibeDropdown 
              value={formData.occasion}
              onChange={(val: string) => onFormChange("occasion", val)}
            />
          </div>
        </div>

        {/* 模型选择 - 左右滑动，宽度固定不随图片数量变宽 */}
        <div className="flex flex-col gap-2 w-full max-w-3xl min-w-0">
          <span className="flex items-center gap-2 text-base font-bold text-[#171412]">
            <span className="material-symbols-outlined text-[#8B4513]">
              person_search
            </span>
            Select Model
          </span>
          <div className="relative -mx-2 w-full max-w-full min-w-0 overflow-x-auto overflow-y-hidden">
            <div className="flex gap-4 py-2 px-2 w-max scroll-smooth snap-x snap-mandatory [scrollbar-width:auto] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#C9B89C]/60 [&::-webkit-scrollbar-track]:bg-[#EDE0D4]/50">
              {sortedModels.map((model) => (
                <div
                  key={model.id}
                  className={`flex-shrink-0 w-[90px] h-[120px] rounded-xl border-2 overflow-hidden cursor-pointer hover:opacity-90 transition-all snap-center ${
                    selectedModelId === model.id
                      ? "border-[#8B4513] ring-2 ring-[#8B4513]/30"
                      : "border-[#C9B89C] hover:border-[#8B5E3C]"
                  }`}
                  onClick={() => handleModelSelect(model.id)}
                >
                  <img
                    src={model.imageUrl}
                    alt={model.name}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 额外要求 */}
        <label className="flex flex-col gap-2 flex-1">
          <span className="flex items-center gap-2 text-base font-bold text-[#171412]">
            <span className="material-symbols-outlined text-[#8B4513]">
              magic_button
            </span>
            Anything else?
          </span>
          <textarea
            className="w-full rounded-lg border border-[#C9B89C] bg-white p-4 text-base flex-1 min-h-[100px] focus:ring-[#8B4513] focus:border-[#8B4513] placeholder:italic outline-none resize-none text-[#171412] placeholder:text-[#857266]"
            placeholder="e.g., 'Something gothic but cute', 'Clean-Fit style (all black outfit)', etc."
            value={formData.additionalNotes}
            onChange={(e) => onFormChange("additionalNotes", e.target.value)}
            maxLength={500}
          />
          {formData.additionalNotes.length > 400 && (
            <p className="text-right text-xs text-stone-400 mt-1">
              {formData.additionalNotes.length} / 500
            </p>
          )}
        </label>
      </div>

      {/* 生成按钮 */}
      <button
        className={`group relative mt-6 w-full ${
          isGenerating
            ? "bg-[#7B5C49] cursor-not-allowed"
            : "bg-[#8B4513] hover:bg-[#A0522D]"
        } text-white text-lg font-extrabold py-5 rounded-xl transition-all shadow-md flex items-center justify-center gap-3 shrink-0`}
        onClick={onGenerate}
        disabled={isGenerating}
      >
        <span className="material-symbols-outlined">auto_fix_high</span>
        {isGenerating ? "GENERATING..." : "GENERATE MY OUTFIT"}
        <span className="material-symbols-outlined text-[#DAB8B8] absolute top-2 right-4 group-hover:scale-125 transition-transform">
          flare
        </span>
        <span className="material-symbols-outlined text-[#DAB8B8] absolute bottom-2 left-4 scale-75 group-hover:scale-110 transition-transform">
          star
        </span>
      </button>
    </div>
  );
};

export default DesignForm;
