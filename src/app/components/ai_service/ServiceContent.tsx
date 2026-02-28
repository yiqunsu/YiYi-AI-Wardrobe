"use client";

import DesignForm from "./DesignForm";
import MagicMirror from "./MagicMirror";

interface ServiceContentProps {
  formData: {
    location: string;
    locationLat: number | null;
    locationLon: number | null;
    date: Date;
    occasion: string;
    modelId: string;
    additionalNotes: string;
  };
  generatedOutfit: any;
  isGenerating: boolean;
  generatingStep?: string;
  error?: string | null;
  onFormChange: (field: string, value: any) => void;
  onGenerate: () => void;
}

const ServiceContent = ({
  formData,
  generatedOutfit,
  isGenerating,
  generatingStep,
  error,
  onFormChange,
  onGenerate,
}: ServiceContentProps) => {
  return (
    <div className="flex flex-col lg:flex-row gap-12 items-stretch min-h-[750px]">
      {/* 左侧表单区域 */}
      <div className="flex-1 w-full">
        <DesignForm
          formData={formData}
          onFormChange={onFormChange}
          onGenerate={onGenerate}
          isGenerating={isGenerating}
        />
      </div>

      {/* 右侧结果展示区域：限制最大宽度使魔镜更窄，flex 列 + 子元素填满 */}
      <div className="flex-1 w-full max-w-[420px] flex flex-col min-h-0">
        <MagicMirror
          generatedOutfit={generatedOutfit}
          isGenerating={isGenerating}
          generatingStep={generatingStep}
          error={error}
        />
      </div>
    </div>
  );
};

export default ServiceContent;
