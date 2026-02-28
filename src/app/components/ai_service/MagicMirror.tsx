"use client";

import { useState, useEffect } from "react";

interface MagicMirrorProps {
  generatedOutfit: any;
  isGenerating: boolean;
  generatingStep?: string;
  error?: string | null;
}

const MagicMirror = ({ generatedOutfit, isGenerating, generatingStep, error }: MagicMirrorProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // 对话框里要逐字打出的文案。后端返回后请把 YiYi 说的话放在 generatedOutfit.message 里
  const fullMessage = generatedOutfit?.message ?? "";
  const [displayedMessage, setDisplayedMessage] = useState("");

  // 当后端返回了新的 message 时，从第一个字开始逐字打出
  useEffect(() => {
    if (!fullMessage) {
      setDisplayedMessage("");
      return;
    }
    setDisplayedMessage("");
    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      setDisplayedMessage(fullMessage.slice(0, index));
      if (index >= fullMessage.length) clearInterval(timer);
    }, 50);
    return () => clearInterval(timer); // 组件卸载或 fullMessage 变化时清掉定时器
  }, [fullMessage]);

  const handleCopy = async () => {
    const img = generatedOutfit?.image;
    if (!img) return;
    try {
      const response = await fetch(img);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      // Optional: show toast - for now no UI feedback
    } catch {
      // Fallback: copy image URL
      await navigator.clipboard.writeText(img);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    // TODO: 接后端时保存收藏状态
  };

  const handleDetails = () => {
    setShowDetails(!showDetails);
  };

  const handleDownload = () => {
    const img = generatedOutfit?.image;
    if (!img) return;
    const link = document.createElement("a");
    link.href = img;
    link.download = `yiyi-outfit-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="flex-1 w-full flex flex-col min-h-0">
      {/* YiYi 头像和对话框：对话框 flex-1 撑满，右侧会和下面 Magic Mirror 对齐 */}
      <div className="flex items-center gap-2 mb-6 w-full shrink-0">
        <div className="relative group shrink-0">
          <div className="size-20 rounded-full border-4 border-[#8B4513] overflow-hidden bg-white shadow-lg">
            <img
              src="/images/yiyi_profile_photo.webp"
              alt="YiYi"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-[#DAB8B8] text-white px-2 py-0.5 rounded-full font-black text-[9px] rotate-[-5deg] border border-[#8B4513]">
            YiYi
          </div>
        </div>
        <div className="relative flex-1 min-w-0 bg-gradient-to-br from-[#FDF8F3] to-[#F5EDE4] px-5 py-4 rounded-2xl border-2 border-[#C9B89C] shadow-lg shadow-[#8B4513]/10">
          <p className="text-sm font-semibold text-[#5C4033] break-words leading-relaxed">
            {isGenerating
              ? (generatingStep || "Generating your perfect outfit...")
              : error
              ? "Oops, something went wrong. Please try again!"
              : fullMessage
              ? displayedMessage
              : "I'm ready when you are!"}
          </p>
        </div>
      </div>

      {/* 魔镜展示区域：flex-1 拉长，min-h 保证足够高 */}
      <div className="flex-1 w-full min-h-[420px] bg-[#EDE0D4] rounded-[2.5rem] border border-[#C9B89C] shadow-sm relative overflow-hidden flex flex-col items-center justify-center">
        <div
          className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#a05222] via-transparent to-transparent"
          style={{
            boxShadow:
              "0 0 25px rgba(160, 82, 34, 0.15), inset 0 0 40px rgba(255, 255, 255, 0.8)",
          }}
        ></div>
        <div className="text-center p-8 z-10 w-full h-full flex flex-col items-center justify-center">
          {isGenerating ? (
            <>
              <div className="flex gap-4 justify-center mb-6">
                <span className="material-symbols-outlined text-[#a05222]/50 animate-pulse text-4xl">
                  auto_awesome
                </span>
                <span className="material-symbols-outlined text-[#a05222]/50 animate-pulse text-4xl">
                  colors_spark
                </span>
                <span className="material-symbols-outlined text-[#a05222]/50 animate-pulse text-4xl">
                  auto_awesome
                </span>
              </div>
              <h3 className="text-2xl font-black text-[#8B4513] uppercase tracking-[0.2em]">
                Creating Magic...
              </h3>
              {generatingStep && (
                <p className="text-[#857266] mt-3 text-sm font-medium animate-pulse">
                  {generatingStep}
                </p>
              )}
            </>
          ) : error ? (
            <>
              <span className="material-symbols-outlined text-5xl text-[#8B4513]/40 mb-4 block">
                error_outline
              </span>
              <h3 className="text-lg font-bold text-[#8B4513] mb-2">Something went wrong</h3>
              <p className="text-sm text-[#857266] max-w-[260px] text-center leading-relaxed">
                {error}
              </p>
            </>
          ) : generatedOutfit?.image ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={generatedOutfit.image}
                alt="Generated outfit"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          ) : (
            <>
              <span className="material-symbols-outlined text-8xl text-[#8B4513]/30 mb-6 block">
                temp_preferences_custom
              </span>
              <h3 className="text-2xl font-black text-[#8B4513] uppercase tracking-[0.2em]">
                Magic Mirror
              </h3>
              <p className="text-[#857266] mt-4 font-medium italic">
                Picking the perfect outfit from the wardrobe ...
              </p>
              <div className="flex gap-4 mt-8 justify-center">
                <span className="material-symbols-outlined text-[#8B4513]/30">
                  auto_awesome
                </span>
                <span className="material-symbols-outlined text-[#8B4513]/30">
                  checkroom
                </span>
                <span className="material-symbols-outlined text-[#8B4513]/30">
                  checkroom
                </span>
                <span className="material-symbols-outlined text-[#8B4513]/30">
                  checkroom
                </span>
                <span className="material-symbols-outlined text-[#8B4513]/30">
                  auto_awesome
                </span>
              </div>
            </>
          )}
        </div>
        {/* 装饰心形 */}
        <span className="material-symbols-outlined absolute top-6 left-6 text-[#8B4513]/20">
          favorite
        </span>
        <span className="material-symbols-outlined absolute top-6 right-6 text-[#8B4513]/20">
          favorite
        </span>
        <span className="material-symbols-outlined absolute bottom-6 left-6 text-[#8B4513]/20">
          favorite
        </span>
        <span className="material-symbols-outlined absolute bottom-6 right-6 text-[#8B4513]/20">
          favorite
        </span>
      </div>

      {/* 详情面板 */}
      {showDetails && generatedOutfit && (
        <div className="mt-4 w-full p-4 rounded-xl bg-gradient-to-br from-[#FDF8F3] to-[#F5EDE4] border-2 border-[#C9B89C]">
          <h4 className="font-bold text-[#171412] mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#8B4513]">
              description
            </span>
            Details
          </h4>
          <p className="text-sm text-[#5C4033] leading-relaxed">
            {generatedOutfit.description || generatedOutfit.message || "No description available."}
          </p>
        </div>
      )}

      {/* 底部操作按钮：mt-auto 贴底，与左侧模块底边对齐 */}
      <div className="flex gap-6 mt-auto pt-6 shrink-0 justify-center">
        <button
          className="flex items-center justify-center p-4 bg-white border border-[#C9B89C] rounded-full text-[#7B5C49] hover:bg-[#EDE0D4] transition-colors shadow-sm group disabled:opacity-50 disabled:cursor-not-allowed"
          title="Copy Image"
          onClick={handleCopy}
          disabled={!generatedOutfit?.image}
        >
          <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">
            content_copy
          </span>
        </button>
        <button
          className={`flex items-center justify-center p-4 bg-white border border-[#C9B89C] rounded-full text-[#7B5C49] hover:bg-[#EDE0D4] transition-colors shadow-sm group ${
            isLiked ? "text-[#DAB8B8]" : ""
          }`}
          title="Favorite Image"
          onClick={handleLike}
        >
          <span
            className={`material-symbols-outlined text-2xl group-hover:scale-110 transition-transform ${
              isLiked ? "fill-current" : ""
            }`}
          >
            favorite
          </span>
        </button>
        <button
          className={`flex items-center justify-center p-4 rounded-full transition-colors group ${
            showDetails
              ? "bg-[#8B5E3C] text-white"
              : "bg-white border-2 border-[#7B5C49] text-[#7B5C49] hover:bg-[#F5EDE0] shadow-[3px_3px_0px_#7B5C49] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          }`}
          title="Show Detailed Description"
          onClick={handleDetails}
          disabled={!generatedOutfit}
        >
          <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">
            description
          </span>
        </button>
        <button
          className="flex items-center justify-center p-4 bg-white border-2 border-[#7B5C49] rounded-full text-[#7B5C49] hover:bg-[#F5EDE0] transition-colors shadow-[3px_3px_0px_#7B5C49] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none group disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          title="Download Render"
          onClick={handleDownload}
          disabled={!generatedOutfit?.image}
        >
          <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">
            download
          </span>
        </button>
      </div>
    </div>
  );
};

export default MagicMirror;
