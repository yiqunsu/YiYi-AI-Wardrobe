/**
 * Model collection page [module: app / service / collection]
 * Allows users to manage their virtual try-on avatar photos (upload, set default, delete).
 */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useModels } from "@/contexts/ModelsContext";
import type { ModelItem } from "@/contexts/ModelsContext";

/* ─────────────────────────────────────────────
   全图 Lightbox 弹窗
───────────────────────────────────────────── */
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
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <img
          src={src}
          alt={alt}
          className="max-w-[min(420px,90vw)] max-h-[80vh] object-contain rounded-2xl shadow-2xl"
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

/* ─────────────────────────────────────────────
   模特卡片
───────────────────────────────────────────── */
function ModelCard({
  model,
  isSelected,
  onSelect,
  onSetDefault,
  onRemove,
  onRename,
}: {
  model: ModelItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onSetDefault: (id: string) => void;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
}) {
  const [editingName, setEditingName] = useState(model.name);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleDelete = useCallback(() => {
    if (confirmDelete) {
      onRemove(model.id);
    } else {
      setConfirmDelete(true);
    }
  }, [confirmDelete, model.id, onRemove]);

  return (
    <>
      <div
        className={`rounded-2xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-[360px] ${
          isSelected
            ? "border-[#8B4513] ring-2 ring-[#8B4513]/20"
            : "border-[#C9B89C]"
        }`}
      >
        {/* ── 图片区域 ── */}
        <div className="relative bg-[#EDE0D4] flex-1 min-h-0 group/img">
          <button
            type="button"
            className="w-full h-full block focus:outline-none"
            onClick={() => setLightboxOpen(true)}
            aria-label="View full image"
          >
            <img
              src={model.imageUrl}
              alt={model.name}
              className="w-full h-full object-contain"
            />
            {/* hover 蒙层 */}
            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors duration-200 flex items-center justify-center pointer-events-none">
              <span className="material-symbols-outlined text-white text-4xl opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 drop-shadow-lg">
                zoom_in
              </span>
            </div>
          </button>

          {/* Default 角标 */}
          {model.isDefault && (
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#8B4513] text-white text-[11px] font-semibold pointer-events-none">
              <span
                className="material-symbols-outlined text-[12px] leading-none"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
              Default
            </div>
          )}

          {/* 选中勾 */}
          {isSelected && (
            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#8B4513] flex items-center justify-center pointer-events-none">
              <span className="material-symbols-outlined text-white text-[13px] leading-none">
                check
              </span>
            </div>
          )}
        </div>

        {/* ── 名称 ── */}
        <div className="px-3 pt-3 pb-1 shrink-0">
          {model.isSystemDefault ? (
            <p className="text-sm font-semibold text-[#171412] truncate text-center">
              {model.name}
            </p>
          ) : (
            <div
              className="flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {isEditing ? (
                <input
                  autoFocus
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={(e) => {
                    setIsEditing(false);
                    if (e.target.value.trim())
                      onRename(model.id, e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") {
                      setIsEditing(false);
                      setEditingName(model.name);
                    }
                  }}
                  className="w-full text-sm font-semibold text-[#171412] text-center bg-[#FAF6F2] border border-[#C9B89C] focus:border-[#8B4513] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#8B4513]/30"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setEditingName(model.name);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 group/btn"
                >
                  <span className="text-sm font-semibold text-[#171412] truncate">
                    {model.name}
                  </span>
                  <span className="material-symbols-outlined text-[13px] leading-none text-stone-300 opacity-0 group-hover/btn:opacity-100 transition-opacity shrink-0">
                    edit
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── 操作栏 — 始终占位 ── */}
        <div className="px-3 pb-1 pt-1 flex items-center gap-2 shrink-0">
          {model.isSystemDefault ? (
            /* 系统卡占位，维持高度 */
            <div/>
          ) : (
            <>
              {/* Set Default */}
              {!confirmDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetDefault(model.id);
                  }}
                  className={`flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-xs font-semibold transition-colors duration-150 ${
                    model.isDefault
                      ? "bg-[#EDE0D4] text-[#8B4513]"
                      : "bg-[#F5EFE8] text-stone-500 hover:bg-[#EDE0D4] hover:text-[#8B4513]"
                  }`}
                >
                  {model.isDefault ? "Default" : "Set Default"}
                </button>
              )}

              {/* 删除 */}
              {confirmDelete ? (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                    className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(false);
                    }}
                    className="px-3 py-2 rounded-xl text-stone-400 text-xs hover:text-stone-600 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(true);
                  }}
                  className="p-2 rounded-xl text-stone-300 hover:text-red-400 transition-colors duration-150"
                  title="Delete"
                >
                  <span className="material-symbols-outlined text-sm leading-none">
                    delete
                  </span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 全图弹窗 */}
      {lightboxOpen && (
        <ImageLightbox
          src={model.imageUrl}
          alt={model.name}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

/* ─────────────────────────────────────────────
   页面
───────────────────────────────────────────── */
export default function CollectionPage() {
  const { models, loading, error, addModel, updateModel, removeModel } =
    useModels();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (models.length > 0 && !selectedId) {
      const defaultModel = models.find((m) => m.isDefault) ?? models[0];
      setSelectedId(defaultModel.id);
    }
  }, [models, selectedId]);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setIsUploading(true);
    let firstId: string | null = null;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      const name =
        file.name.replace(/\.[^/.]+$/, "") || `Model ${models.length + i + 1}`;
      const added = await addModel(file, name);
      if (added && !firstId) firstId = added.id;
    }
    if (firstId) setSelectedId(firstId);
    setIsUploading(false);
    e.target.value = "";
  };

  const handleSetDefault = (id: string) => {
    updateModel(id, { isDefault: true });
    setSelectedId(id);
  };

  const handleRemove = (id: string) => {
    removeModel(id);
    if (selectedId === id) {
      const remaining = models.filter((m) => m.id !== id);
      setSelectedId(remaining[0]?.id ?? null);
    }
  };

  const handleRename = (id: string, name: string) => {
    if (name.trim()) updateModel(id, { name: name.trim() });
  };

  const systemModels = models.filter((m) => m.isSystemDefault);
  const userModels = models.filter((m) => !m.isSystemDefault);

  const renderGrid = (list: ModelItem[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
      {list.map((model) => (
        <ModelCard
          key={model.id}
          model={model}
          isSelected={selectedId === model.id}
          onSelect={setSelectedId}
          onSetDefault={handleSetDefault}
          onRemove={handleRemove}
          onRename={handleRename}
        />
      ))}
    </div>
  );

  return (
    <div className="flex-1 py-10 px-6 overflow-auto">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="serif-font text-3xl font-bold text-[#171412] mb-2">
            My Models
          </h1>
          <p className="text-stone-600">
            Upload your photos to use as models for virtual try-on. The default
            model is used in Today&apos;s Look.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Upload area */}
        <div
          onClick={handleUploadClick}
          className={`mb-8 rounded-2xl border-2 border-dashed border-[#C9B89C] bg-[#EDE0D4]/50 p-12 text-center cursor-pointer transition-all hover:border-[#8B4513] hover:bg-[#EDE0D4]/80 ${
            isUploading || loading ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <span className="material-symbols-outlined text-5xl text-[#8B4513] mb-4 block">
            person_add
          </span>
          <h3 className="text-lg font-bold text-[#171412] mb-2">
            {isUploading ? "Uploading..." : "Add model photo"}
          </h3>
          <p className="text-stone-600 text-sm">
            Upload a clear front-facing photo for best virtual try-on results.
          </p>
        </div>

        {/* Models grid */}
        {loading ? (
          <div className="rounded-2xl border border-[#C9B89C] bg-[#EDE0D4]/30 p-16 text-center">
            <p className="text-stone-600">Loading models...</p>
          </div>
        ) : models.length === 0 ? (
          <div className="rounded-2xl border border-[#C9B89C] bg-[#EDE0D4]/30 p-16 text-center">
            <span className="material-symbols-outlined text-6xl text-[#8B4513]/40 mb-4 block">
              person_search
            </span>
            <p className="text-stone-600">No models yet. Upload your first one!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* 系统自带 */}
            {systemModels.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[13px] leading-none">
                    auto_awesome
                  </span>
                  System
                </p>
                {renderGrid(systemModels)}
              </div>
            )}

            {/* 虚线分隔 */}
            {systemModels.length > 0 && userModels.length > 0 && (
              <div className="border-t-2 border-dashed border-[#C9B89C]" />
            )}

            {/* 用户上传 */}
            {userModels.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[13px] leading-none">
                    person
                  </span>
                  My Photos
                </p>
                {renderGrid(userModels)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
