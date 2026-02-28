"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useHistory } from "@/app/contexts/HistoryContext";
import type { HistoryItem } from "@/app/contexts/HistoryContext";
import type { SelectedWardrobeItem } from "@/lib/supabase-data";

function formatDate(d: Date) {
  const today = new Date();
  const diff = today.getTime() - d.getTime();
  if (diff < 86400000) return "Today";
  if (diff < 172800000) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

function WardrobeItemModal({
  item,
  onClose,
}: {
  item: SelectedWardrobeItem;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex border border-[#C9B89C]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 左侧图片 */}
        <div className="flex-shrink-0 w-1/2 min-w-0 flex items-center justify-center bg-stone-100 p-4">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="max-h-[70vh] w-auto object-contain rounded-xl"
          />
        </div>

        {/* 右侧信息 */}
        <div className="flex-1 flex flex-col min-w-0 p-6 border-l border-[#C9B89C]">
          <h3 className="text-lg font-bold text-[#171412] mb-1">{item.name || "—"}</h3>
          <span className="inline-flex items-center self-start px-2.5 py-0.5 rounded-full bg-[#EDE0D4] text-[#8B5E3C] text-xs font-semibold capitalize mb-5">
            {item.category}
          </span>

          {typeof item.metadata?.warmth === "number" && (
            <div className="mb-4">
              <p className="text-sm font-medium text-[#171412] mb-2">
                Warmth (Level {item.metadata.warmth})
              </p>
              <div className="flex items-center gap-3">
                <span className="text-sm text-stone-500 w-14 shrink-0">Light</span>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={item.metadata.warmth}
                  readOnly
                  className="w-44 h-2 shrink-0 rounded-full appearance-none bg-[#EDE0D4] accent-[#8B5E3C] cursor-default"
                />
                <span className="text-sm text-stone-500 w-10 shrink-0">Warm</span>
              </div>
            </div>
          )}

          {typeof item.metadata?.formality === "number" && (
            <div className="mb-4">
              <p className="text-sm font-medium text-[#171412] mb-2">
                Formality (Level {item.metadata.formality})
              </p>
              <div className="flex items-center gap-3">
                <span className="text-sm text-stone-500 w-14 shrink-0">Casual</span>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={item.metadata.formality}
                  readOnly
                  className="w-44 h-2 shrink-0 rounded-full appearance-none bg-[#EDE0D4] accent-[#8B5E3C] cursor-default"
                />
                <span className="text-sm text-stone-500 w-10 shrink-0">Formal</span>
              </div>
            </div>
          )}

          {item.metadata?.description && (
            <p className="text-sm text-stone-600 leading-relaxed mt-1">
              {item.metadata.description}
            </p>
          )}
        </div>

        {/* 关闭按钮 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center rounded-full bg-white/95 backdrop-blur-sm border border-[#C9B89C] text-[#171412] shadow-sm hover:bg-[#EDE0D4] hover:border-[#8B4513] z-10"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  );
}

function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-[min(480px,90vw)] max-h-[70vh] object-contain rounded-2xl shadow-2xl"
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 transition-colors"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
    </div>
  );
}

function HistoryCard({
  item,
  onToggleLike,
  onDelete,
}: {
  item: HistoryItem;
  onToggleLike: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [descExpanded, setDescExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [previewItem, setPreviewItem] = useState<SelectedWardrobeItem | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleDelete = useCallback(() => {
    if (confirmDelete) {
      onDelete(item.id);
    } else {
      setConfirmDelete(true);
    }
  }, [confirmDelete, item.id, onDelete]);

  const description = item.description || item.message;
  const descLong = (description?.length ?? 0) > 120;

  return (
    <>
      <div className="rounded-2xl border border-[#C9B89C] bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">

        {/* ── 图片区域 ── */}
        <div className="relative aspect-square bg-[#EDE0D4] shrink-0">
          {item.imageUrl ? (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="w-full h-full block group/img relative focus:outline-none"
              aria-label="View full image"
            >
              <img
                src={item.imageUrl}
                alt={item.occasion}
                className="w-full h-full object-contain"
              />
              {/* hover 蒙层 */}
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/15 transition-colors duration-200 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-4xl opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 drop-shadow-lg">
                  zoom_in
                </span>
              </div>
            </button>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-sm text-stone-400 italic">None</span>
            </div>
          )}

          {/* 图片底部渐变信息条 */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/55 to-transparent px-3 pb-3 pt-8 pointer-events-none">
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm leading-tight capitalize truncate">
                  {item.occasion || "None"}
                </p>
                <p className="text-white/75 text-xs leading-tight mt-0.5 truncate flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px] leading-none">location_on</span>
                  {item.location || "None"}
                </p>
              </div>
              <span className="text-white/80 text-xs shrink-0 bg-black/30 rounded-full px-2 py-0.5">
                {formatDate(item.date)}
              </span>
            </div>
          </div>

          {/* 喜欢角标 */}
          {item.isLiked && (
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#8B4513] text-white text-[11px] font-semibold pointer-events-none">
              <span className="material-symbols-outlined text-[12px] leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                favorite
              </span>
              Liked
            </div>
          )}
        </div>

        {/* ── 卡片正文 ── */}
        <div className="flex flex-col flex-1 px-4 pt-4 pb-3 gap-3">

          {/* 备注 */}
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
              <span className="material-symbols-outlined text-[11px] leading-none">edit_note</span>
              Your Note
            </span>
            {item.additionalNotes ? (
              <p className="text-xs text-stone-400 leading-relaxed line-clamp-1 italic">
                {item.additionalNotes}
              </p>
            ) : (
              <p className="text-xs text-stone-300 italic">None</p>
            )}
          </div>

          {/* Stylist Note */}
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-[#8B5E3C]">
              <span className="material-symbols-outlined text-[11px] leading-none">auto_awesome</span>
              Stylist Note
            </span>
            <div className="bg-[#FAF6F2] rounded-xl px-3 py-2.5">
              {description ? (
                <>
                  <p className={`text-xs text-stone-500 leading-relaxed italic ${descExpanded ? "" : "line-clamp-2"}`}>
                    &ldquo;{description}&rdquo;
                  </p>
                  {descLong && (
                    <button
                      onClick={() => setDescExpanded((v) => !v)}
                      className="mt-1.5 flex items-center gap-0.5 text-[11px] text-[#8B5E3C] font-medium hover:underline"
                    >
                      {descExpanded ? "Show less" : "Read more"}
                      <span className="material-symbols-outlined text-[12px] leading-none">
                        {descExpanded ? "expand_less" : "expand_more"}
                      </span>
                    </button>
                  )}
                </>
              ) : (
                <p className="text-xs text-stone-300 italic">None</p>
              )}
            </div>
          </div>

          {/* 选中单品 — 横向滚动 */}
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
              <span className="material-symbols-outlined text-[11px] leading-none">checkroom</span>
              Selected Items
            </span>
            {item.selectedItems && item.selectedItems.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
                {item.selectedItems.map((wi) => (
                  <button
                    key={wi.id}
                    type="button"
                    title={wi.name}
                    onClick={() => setPreviewItem(wi)}
                    className="w-12 h-12 rounded-lg overflow-hidden border border-[#C9B89C] bg-[#EDE0D4] shrink-0 transition-transform duration-150 hover:-translate-y-1 hover:shadow-md focus:outline-none"
                  >
                    <img src={wi.imageUrl} alt={wi.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-300 italic">None</p>
            )}
          </div>
        </div>

        {/* ── 操作栏 ── */}
        <div className="px-4 pb-4 pt-0 flex items-center gap-2">
          {/* 喜欢按钮 */}
          <button
            onClick={() => onToggleLike(item.id)}
            className={`flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-xs font-semibold transition-colors duration-150 ${
              item.isLiked
                ? "bg-[#EDE0D4] text-[#8B4513]"
                : "bg-[#F5EFE8] text-stone-500 hover:bg-[#EDE0D4] hover:text-[#8B4513]"
            }`}
          >
            <span
              className="material-symbols-outlined text-sm leading-none"
              style={item.isLiked ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              favorite
            </span>
            {item.isLiked ? "Liked" : "Like"}
          </button>

          {/* 删除按钮 */}
          {confirmDelete ? (
            <>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
              >
                Confirm delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-2 rounded-xl text-stone-400 text-xs hover:text-stone-600 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-2 rounded-xl text-stone-300 hover:text-red-400 transition-colors duration-150"
              title="Delete"
            >
              <span className="material-symbols-outlined text-sm leading-none">delete</span>
            </button>
          )}
        </div>
      </div>

      {/* 效果图全图弹窗 */}
      {lightboxOpen && item.imageUrl && (
        <ImageLightbox
          src={item.imageUrl}
          alt={item.occasion}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* 衣物详情弹窗 */}
      {previewItem && (
        <WardrobeItemModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </>
  );
}

export default function HistoryPage() {
  const { historyItems, loading, error, fetchHistory, toggleLike, deleteHistoryItem } =
    useHistory();
  const [filter, setFilter] = useState<"all" | "liked">("all");

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredHistory =
    filter === "liked"
      ? historyItems.filter((h) => h.isLiked)
      : historyItems;

  return (
    <div className="flex-1 py-10 px-6 overflow-auto">
      <div className="mx-auto max-w-6xl">
        {/* 头部 */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="serif-font text-3xl font-bold text-[#171412] mb-2">
              History
            </h1>
            <p className="text-stone-600">
              View your past outfit recommendations and favorites.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === "all"
                  ? "bg-[#8B5E3C] text-white"
                  : "bg-white border border-[#C9B89C] text-[#171412] hover:bg-[#EDE0D4]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("liked")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === "liked"
                  ? "bg-[#8B5E3C] text-white"
                  : "bg-white border border-[#C9B89C] text-[#171412] hover:bg-[#EDE0D4]"
              }`}
            >
              <span
                className="material-symbols-outlined text-lg"
                style={
                  filter === "liked"
                    ? { fontVariationSettings: "'FILL' 1" }
                    : {}
                }
              >
                favorite
              </span>
              Favorites
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 内容区 */}
        {loading ? (
          <div className="rounded-2xl border border-[#C9B89C] bg-[#EDE0D4]/30 p-16 text-center">
            <p className="text-stone-600">Loading history...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="rounded-2xl border border-[#C9B89C] bg-[#EDE0D4]/30 p-16 text-center">
            <span className="material-symbols-outlined text-6xl text-[#8B4513]/40 mb-4 block">
              history
            </span>
            <p className="text-stone-600 mb-6">
              {filter === "liked"
                ? "No favorites yet. Generate outfits and like them!"
                : "No history yet. Create your first outfit in Today\u2019s Look."}
            </p>
            <Link
              href="/service/create"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#8B5E3C] text-white font-bold hover:bg-[#A0522D] transition-colors"
            >
              <span className="material-symbols-outlined">auto_fix_high</span>
              Go to Today&apos;s Look
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-start">
            {filteredHistory.map((item) => (
              <HistoryCard
                key={item.id}
                item={item}
                onToggleLike={toggleLike}
                onDelete={deleteHistoryItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
