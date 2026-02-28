"use client";

import ServiceHero from "./ServiceHero";
import ServiceContent from "./ServiceContent";

interface ServiceMainProps {
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

const ServiceMain = ({
  formData,
  generatedOutfit,
  isGenerating,
  generatingStep,
  error,
  onFormChange,
  onGenerate,
}: ServiceMainProps) => {
  return (
    <main className="flex-1 flex justify-center py-10 px-6">
      <div className="max-w-[1300px] w-full flex flex-col gap-8">
        <ServiceHero />
        <ServiceContent
          formData={formData}
          generatedOutfit={generatedOutfit}
          isGenerating={isGenerating}
          generatingStep={generatingStep}
          error={error}
          onFormChange={onFormChange}
          onGenerate={onGenerate}
        />
      </div>
    </main>
  );
};

export default ServiceMain;
