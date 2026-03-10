/**
 * MagicMirror [module: components / service]
 * Outfit result display panel. Shows the AI-generated try-on image,
 * the stylist's message, and the list of selected wardrobe items.
 * Also handles liking/unliking the outfit via the outfit.queries API.
 */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toggleOutfitLike } from "@/lib/db/queries/outfit.queries";

interface SelectedItem {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
}

interface GeneratedOutfit {
  image: string | null;
  message: string;
  description?: string;
  selectedItemIds: string[];
  generationId?: string | null;
  selectedItems?: SelectedItem[];
}

interface MagicMirrorProps {
  generatedOutfit: GeneratedOutfit | null;
  isGenerating: boolean;
  generatingStep?: string;
  error?: string | null;
}

const MagicMirror = ({ generatedOutfit, isGenerating, generatingStep, error }: MagicMirrorProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [downloadState, setDownloadState] = useState<"idle" | "done">("idle");
  const [showMessage, setShowMessage] = useState(false);
  const [bubbleRect, setBubbleRect] = useState<DOMRect | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // 新 outfit 生成时重置所有按钮状态
  useEffect(() => {
    setIsLiked(false);
    setShowDetails(false);
    setCopyState("idle");
    setDownloadState("idle");
    setShowMessage(false);
  }, [generatedOutfit?.generationId]);

  // 逐字打印 YiYi 的回复
  const fullMessage = generatedOutfit?.message ?? "";
  const [displayedMessage, setDisplayedMessage] = useState("");
  useEffect(() => {
    if (!fullMessage) { setDisplayedMessage(""); return; }
    setDisplayedMessage("");
    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      setDisplayedMessage(fullMessage.slice(0, index));
      if (index >= fullMessage.length) clearInterval(timer);
    }, 50);
    return () => clearInterval(timer);
  }, [fullMessage]);

  // ── 按钮 1：拷贝图片 ──────────────────────────────────────
  const handleCopy = useCallback(async () => {
    const img = generatedOutfit?.image;
    if (!img) return;
    try {
      const response = await fetch(img);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setCopyState("copied");
    } catch {
      // 某些浏览器不支持 ClipboardItem，降级拷贝 URL
      try { await navigator.clipboard.writeText(img); } catch { /* ignore */ }
      setCopyState("copied");
    }
    setTimeout(() => setCopyState("idle"), 2000);
  }, [generatedOutfit?.image]);

  // ── 按钮 2：爱心 Like ────────────────────────────────────
  const handleLike = useCallback(async () => {
    const id = generatedOutfit?.generationId;
    if (!id || likeLoading) return;
    setLikeLoading(true);
    try {
      const next = await toggleOutfitLike(id);
      setIsLiked(next);
    } catch {
      // 静默失败，不影响 UI
    } finally {
      setLikeLoading(false);
    }
  }, [generatedOutfit?.generationId, likeLoading]);

  // ── 按钮 3：详情弹窗 ─────────────────────────────────────
  const handleDetails = useCallback(() => {
    setShowDetails((v) => !v);
  }, []);

  // ── 气泡点击：弹出完整消息 ────────────────────────────────
  const handleBubbleClick = useCallback(() => {
    if (!fullMessage || isGenerating) return;
    if (bubbleRef.current) {
      setBubbleRect(bubbleRef.current.getBoundingClientRect());
    }
    setShowMessage(true);
  }, [fullMessage, isGenerating]);

  // ── 按钮 4：下载图片 ─────────────────────────────────────
  const handleDownload = useCallback(() => {
    const img = generatedOutfit?.image;
    if (!img) return;
    const link = document.createElement("a");
    link.href = img;
    link.download = `yiyi-outfit-${Date.now()}.png`;
    link.click();
    setDownloadState("done");
    setTimeout(() => setDownloadState("idle"), 2000);
  }, [generatedOutfit?.image]);

  const hasOutfit = !!generatedOutfit;
  const hasImage = !!generatedOutfit?.image;
  const hasGenerationId = !!generatedOutfit?.generationId;

  return (
    <div className="flex-1 w-full flex flex-col min-h-0">
      {/* YiYi 头像和对话框 */}
      <div className="flex items-start gap-2 mb-6 w-full shrink-0">
        <div className="relative group shrink-0">
          <div className="size-20 rounded-full border-4 border-[#8B4513] overflow-hidden bg-white shadow-lg">
            <img src="/images/yiyi_profile_photo.webp" alt="YiYi" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-[#DAB8B8] text-white px-2 py-0.5 rounded-full font-black text-[9px] rotate-[-5deg] border border-[#8B4513]">
            YiYi
          </div>
        </div>
        <div
          ref={bubbleRef}
          onClick={handleBubbleClick}
          className={`relative flex-1 min-w-0 h-[52px] overflow-hidden bg-gradient-to-br from-[#FDF8F3] to-[#F5EDE4] px-5 py-4 rounded-2xl border-2 border-[#C9B89C] shadow-lg shadow-[#8B4513]/10 select-none ${fullMessage && !isGenerating ? "cursor-pointer hover:border-[#8B4513]/60 transition-colors" : ""}`}
        >
          <p className="text-sm font-semibold text-[#5C4033] line-clamp-1 leading-relaxed">
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

      {/* 魔镜展示区域 */}
      <div className="flex-1 w-full min-h-[420px] bg-[#EDE0D4] rounded-[2.5rem] border border-[#C9B89C] shadow-sm relative overflow-hidden flex flex-col items-center justify-center">
        <div
          className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#a05222] via-transparent to-transparent"
          style={{ boxShadow: "0 0 25px rgba(160, 82, 34, 0.15), inset 0 0 40px rgba(255, 255, 255, 0.8)" }}
        />
        <div className="text-center p-8 z-10 w-full h-full flex flex-col items-center justify-center">
          {isGenerating ? (
            <>
              <div className="flex gap-4 justify-center mb-6">
                {["auto_awesome", "colors_spark", "auto_awesome"].map((icon, i) => (
                  <span key={i} className="material-symbols-outlined text-[#a05222]/50 animate-pulse text-4xl">{icon}</span>
                ))}
              </div>
              <h3 className="text-2xl font-black text-[#8B4513] uppercase tracking-[0.2em]">Creating Magic...</h3>
              {generatingStep && (
                <p className="text-[#857266] mt-3 text-sm font-medium animate-pulse">{generatingStep}</p>
              )}
            </>
          ) : error ? (
            <>
              <span className="material-symbols-outlined text-5xl text-[#8B4513]/40 mb-4 block">error_outline</span>
              <h3 className="text-lg font-bold text-[#8B4513] mb-2">Something went wrong</h3>
              <p className="text-sm text-[#857266] max-w-[260px] text-center leading-relaxed">{error}</p>
            </>
          ) : hasImage ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img src={generatedOutfit!.image!} alt="Generated outfit" className="max-w-full max-h-full object-contain rounded-lg" />
            </div>
          ) : (
            <>
              <span className="material-symbols-outlined text-8xl text-[#8B4513]/30 mb-6 block">temp_preferences_custom</span>
              <h3 className="text-2xl font-black text-[#8B4513] uppercase tracking-[0.2em]">Magic Mirror</h3>
              <p className="text-[#857266] mt-4 font-medium italic">Picking the perfect outfit from the wardrobe ...</p>
              <div className="flex gap-4 mt-8 justify-center">
                {["auto_awesome", "checkroom", "checkroom", "checkroom", "auto_awesome"].map((icon, i) => (
                  <span key={i} className="material-symbols-outlined text-[#8B4513]/30">{icon}</span>
                ))}
              </div>
            </>
          )}
        </div>
        {/* 装饰心形 */}
        {["top-6 left-6", "top-6 right-6", "bottom-6 left-6", "bottom-6 right-6"].map((pos) => (
          <span key={pos} className={`material-symbols-outlined absolute ${pos} text-[#8B4513]/20`}>favorite</span>
        ))}
      </div>

      {/* 底部操作按钮 */}
      <div className="flex gap-6 mt-auto pt-6 shrink-0 justify-center">
        {/* 拷贝 */}
        <button
          className="flex items-center justify-center p-4 bg-white border-2 border-[#7B5C49] rounded-full transition-colors shadow-[3px_3px_0px_#7B5C49] hover:bg-[#F5EDE0] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none group disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          style={{ color: copyState === "copied" ? "#22c55e" : "#7B5C49" }}
          title={copyState === "copied" ? "Copied!" : "Copy Image"}
          onClick={handleCopy}
          disabled={!hasImage}
        >
          <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">
            {copyState === "copied" ? "check_circle" : "content_copy"}
          </span>
        </button>

        {/* 爱心 */}
        <button
          className="flex items-center justify-center p-4 bg-white border-2 border-[#7B5C49] rounded-full transition-all shadow-[3px_3px_0px_#7B5C49] hover:bg-[#F5EDE0] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none group disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          style={{ color: isLiked ? "#ef4444" : "#7B5C49" }}
          title={isLiked ? "Unlike" : "Like this outfit"}
          onClick={handleLike}
          disabled={!hasOutfit || !hasGenerationId || likeLoading}
        >
          <span
            className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform"
            style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}
          >
            favorite
          </span>
        </button>

        {/* 详情 */}
        <button
          className={`flex items-center justify-center p-4 border-2 rounded-full transition-colors group disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none ${
            showDetails
              ? "bg-[#8B5E3C] border-[#8B5E3C] text-white shadow-[3px_3px_0px_#5C3D20]"
              : "bg-white border-[#7B5C49] text-[#7B5C49] hover:bg-[#F5EDE0] shadow-[3px_3px_0px_#7B5C49] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          }`}
          title="Style Analysis"
          onClick={handleDetails}
          disabled={!hasOutfit}
        >
          <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">description</span>
        </button>

        {/* 下载 */}
        <button
          className="flex items-center justify-center p-4 bg-white border-2 border-[#7B5C49] rounded-full transition-colors shadow-[3px_3px_0px_#7B5C49] hover:bg-[#F5EDE0] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none group disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          style={{ color: downloadState === "done" ? "#22c55e" : "#7B5C49" }}
          title={downloadState === "done" ? "Downloaded!" : "Download Image"}
          onClick={handleDownload}
          disabled={!hasImage}
        >
          <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">
            {downloadState === "done" ? "check_circle" : "download"}
          </span>
        </button>
      </div>

      {/* ── 气泡完整消息 Overlay ────────────────────────────── */}
      {showMessage && bubbleRect && fullMessage && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setShowMessage(false)}
        >
          <div
            className="absolute bg-gradient-to-br from-[#FDF8F3] to-[#F5EDE4] rounded-2xl border-2 border-[#C9B89C] shadow-2xl px-5 py-4"
            style={{
              top: bubbleRect.bottom + 8,
              left: bubbleRect.left,
              width: bubbleRect.width,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-[#5C4033] leading-relaxed">
              {fullMessage}
            </p>
          </div>
        </div>
      )}

      {/* ── 详情弹窗 Modal ──────────────────────────────────── */}
      {showDetails && generatedOutfit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleDetails}
        >
          <div
            className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-gradient-to-br from-[#FDF8F3] to-[#F5EDE4] rounded-3xl border-2 border-[#C9B89C] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-[#E2D4C4] bg-[#FDF8F3]/90 backdrop-blur-sm rounded-t-3xl">
              <h3 className="serif-font font-bold text-[#171412] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8B4513] text-xl">description</span>
                Style Analysis
              </h3>
              <button
                onClick={handleDetails}
                className="flex items-center justify-center w-8 h-8 rounded-full text-stone-400 hover:text-[#8B4513] hover:bg-[#EDE0D4] transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* YiYi 的推荐语 */}
              {generatedOutfit.message && (
                <section>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#8B4513] mb-3">
                    YiYi&apos;s Note
                  </p>
                  <p className="text-sm text-[#5C4033] leading-relaxed">
                    {generatedOutfit.message}
                  </p>
                </section>
              )}

              {/* Style 描述 */}
              {generatedOutfit.description && (
                <section>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#8B4513] mb-3">
                    Styling Description
                  </p>
                  <p className="text-sm text-[#5C4033] leading-relaxed">
                    {generatedOutfit.description}
                  </p>
                </section>
              )}

              {/* 选中单品图片 */}
              {generatedOutfit.selectedItems && generatedOutfit.selectedItems.length > 0 && (
                <section>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#8B4513] mb-3">
                    Selected Items ({generatedOutfit.selectedItems.length})
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {generatedOutfit.selectedItems.map((item) => (
                      <div key={item.id} className="flex flex-col gap-1">
                        <div className="aspect-square rounded-xl overflow-hidden bg-[#EDE0D4] border border-[#C9B89C]">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-[11px] font-medium text-[#5C4033] truncate text-center leading-tight">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-stone-400 capitalize text-center">
                          {item.category}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MagicMirror;
