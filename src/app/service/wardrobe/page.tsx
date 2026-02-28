"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import {
  updateWardrobeItem,
  deleteWardrobeItem,
  type WardrobeItem,
  type WardrobeCategory,
} from "@/lib/supabase-data";

const MAX_BATCH_FILES = 10;

type FilterCategory = "all" | WardrobeCategory;

const CATEGORIES: { value: FilterCategory; label: string; icon: string }[] = [
  { value: "all", label: "All", icon: "grid_view" },
  { value: "tops", label: "Tops", icon: "checkroom" },
  { value: "bottoms", label: "Bottoms", icon: "checkroom" },
  { value: "outerwear", label: "Outerwear", icon: "deck" },
  { value: "shoes", label: "Shoes", icon: "steps" },
  { value: "accessories", label: "Accessories", icon: "watch" },
];

const EDIT_CATEGORIES: { value: WardrobeCategory; label: string }[] = [
  { value: "tops", label: "Tops" },
  { value: "bottoms", label: "Bottoms" },
  { value: "outerwear", label: "Outerwear" },
  { value: "shoes", label: "Shoes" },
  { value: "accessories", label: "Accessories" },
];

type PendingFile = { file: File; id: string; previewUrl: string };
type UploadPhase = "idle" | "uploading" | "processing" | "done";
type BatchResult = { success: string[]; failed: { id: string; error: string }[] };
type ProcessProgress = { completed: number; total: number };

const PROCESS_CONCURRENCY = 3;

export default function WardrobePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);
  const [processProgress, setProcessProgress] = useState<ProcessProgress>({ completed: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editModalItem, setEditModalItem] = useState<WardrobeItem | null>(null);
  const [editDraft, setEditDraft] = useState<{
    name: string;
    category: WardrobeCategory;
    warmth: number;
    formality: number;
  }>({ name: "", category: "tops", warmth: 3, formality: 3 });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<WardrobeItem | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setItems([]);
        return;
      }
      const res = await fetch("/api/wardrobe", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? "Failed to load wardrobe");
      }
      const data = await res.json();
      const list = Array.isArray(data?.items) ? data.items : [];
      setItems(
        list.map((item: Omit<WardrobeItem, "uploadedAt"> & { uploadedAt: string }) => ({
          ...item,
          uploadedAt: new Date(item.uploadedAt),
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load wardrobe");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredItems =
    selectedCategory === "all"
      ? items
      : items.filter((item) => item.category === selectedCategory);

  /** 点击主上传区：只打开弹窗，不直接选文件；清空上一批待上传 */
  const openUploadModal = () => {
    setPendingFiles((prev) => {
      prev.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
      return [];
    });
    setModalOpen(true);
    setBatchError(null);
    setBatchResult(null);
    setUploadWarnings([]);
    setUploadPhase("idle");
    setError(null);
  };

  /** 弹窗内「点击上传」：触发文件选择，可多次添加（批量） */
  const handleAddFilesClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setPendingFiles((prev) => {
      const toAdd: PendingFile[] = imageFiles
        .slice(0, MAX_BATCH_FILES - prev.length)
        .map((file) => ({
          file,
          id: crypto.randomUUID(),
          previewUrl: URL.createObjectURL(file),
        }));
      if (toAdd.length < imageFiles.length) {
        setError(`最多 ${MAX_BATCH_FILES} 张，部分未加入。`);
      }
      return [...prev, ...toAdd].slice(0, MAX_BATCH_FILES);
    });
    setBatchError(null);
    e.target.value = "";
  };

  const removePending = (id: string) => {
    setPendingFiles((prev) => {
      const next = prev.filter((p) => p.id !== id);
      const removed = prev.find((p) => p.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  };

  const closeModal = () => {
    pendingFiles.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
    setModalOpen(false);
    setPendingFiles([]);
    setUploadPhase("idle");
    setBatchError(null);
    setBatchResult(null);
    setUploadWarnings([]);
  };

  const confirmBatchUpload = async () => {
    if (pendingFiles.length === 0 || !user?.id) return;

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setBatchError("Not signed in");
      return;
    }

    setBatchError(null);
    setUploadPhase("uploading");

    try {
      const formData = new FormData();
      pendingFiles.forEach(({ file }) => formData.append("files", file));

      const uploadRes = await fetch("/api/wardrobe/upload-batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) {
        setBatchError(uploadJson?.error ?? "Upload failed");
        setUploadPhase("idle");
        return;
      }

      const wardrobeItemIds = uploadJson.wardrobeItemIds as string[];
      if (Array.isArray(uploadJson.warnings) && uploadJson.warnings.length > 0) {
        setUploadWarnings(uploadJson.warnings);
      } else {
        setUploadWarnings([]);
      }
      if (!Array.isArray(wardrobeItemIds) || wardrobeItemIds.length === 0) {
        setUploadPhase("done");
        setBatchResult({ success: [], failed: [] });
        return;
      }

      setUploadPhase("processing");
      setProcessProgress({ completed: 0, total: wardrobeItemIds.length });

      const success: string[] = [];
      const failed: { id: string; error: string }[] = [];
      const counter = { value: 0 };

      for (let i = 0; i < wardrobeItemIds.length; i += PROCESS_CONCURRENCY) {
        const chunk = wardrobeItemIds.slice(i, i + PROCESS_CONCURRENCY);
        await Promise.all(
          chunk.map(async (id) => {
            try {
              const res = await fetch("/api/wardrobe/process-item", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ wardrobeItemId: id }),
              });
              if (res.ok) {
                success.push(id);
              } else {
                const j = await res.json().catch(() => ({}));
                failed.push({ id, error: j?.error ?? "Processing failed" });
              }
            } catch (e) {
              failed.push({
                id,
                error: e instanceof Error ? e.message : "Unknown error",
              });
            } finally {
              counter.value += 1;
              setProcessProgress({
                completed: counter.value,
                total: wardrobeItemIds.length,
              });
            }
          })
        );
      }

      setUploadPhase("done");
      setBatchResult({ success, failed });
      await load();
    } catch (e) {
      setBatchError(e instanceof Error ? e.message : "Request failed");
      setUploadPhase("idle");
    }
  };

  const handleRemove = (id: string) => {
    setError(null);
    deleteWardrobeItem(id)
      .then(() => setItems((prev) => prev.filter((i) => i.id !== id)))
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Delete failed");
      });
  };

  const openEditModal = (item: WardrobeItem) => {
    setEditModalItem(item);
    const meta = item.metadata;
    const cat = (meta?.category === "outerwear" || meta?.category === "tops" || meta?.category === "bottoms" || meta?.category === "shoes" || meta?.category === "accessories"
      ? meta.category
      : "tops") as WardrobeCategory;
    setEditDraft({
      name: item.name ?? "",
      category: cat,
      warmth: typeof meta?.warmth === "number" ? Math.min(5, Math.max(1, meta.warmth)) : 3,
      formality: typeof meta?.formality === "number" ? Math.min(5, Math.max(1, meta.formality)) : 3,
    });
  };

  const closeEditModal = () => {
    setEditModalItem(null);
  };

  const saveEditModal = async () => {
    if (!editModalItem) return;
    setSavingEdit(true);
    setError(null);
    try {
      await updateWardrobeItem(editModalItem.id, {});
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (token) {
        const res = await fetch("/api/wardrobe/update-metadata", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            wardrobeItemId: editModalItem.id,
            metadata: {
              category: editDraft.category,
              warmth: editDraft.warmth,
              formality: editDraft.formality,
              description: editModalItem.metadata?.description ?? "",
            },
          }),
        });
        if (!res.ok) {
          const j = await res.json();
          throw new Error(j?.error ?? "Failed to update metadata");
        }
      }
      await load();
      setEditModalItem(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="flex-1 py-10 px-6 overflow-auto">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="serif-font text-3xl font-bold text-[#171412] mb-2">
            My Wardrobe
          </h1>
          <p className="text-stone-600">
            Upload and organize your clothes. YiYi uses your wardrobe to create
            the perfect outfit.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 隐藏的 file input 放在外侧，避免弹窗里「Add more」触发时冒泡到上传区导致清空列表 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        {/* 主上传入口：点击只打开弹窗 */}
        <div
          onClick={openUploadModal}
          className={`mb-8 rounded-2xl border-2 border-dashed border-[#C9B89C] bg-[#EDE0D4]/50 p-12 text-center cursor-pointer transition-all hover:border-[#8B4513] hover:bg-[#EDE0D4]/80 ${
            loading ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          <span className="material-symbols-outlined text-5xl text-[#8B4513] mb-4 block">
            cloud_upload
          </span>
          <h3 className="text-lg font-bold text-[#171412] mb-2">
            Upload your clothes
          </h3>
          <p className="text-stone-600 text-sm">
            Click to open upload window, add photos in batch, then confirm. Max {MAX_BATCH_FILES} per batch.
          </p>
        </div>

        {/* 上传弹窗：同风格，内为待上传列表 + 点击上传 + 确认上传 */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col border border-[#C9B89C]">
              <div className="p-6 border-b border-[#C9B89C]">
                <h2 className="text-xl font-bold text-[#171412]">Upload clothes</h2>
                <p className="text-stone-600 text-sm mt-1">
                  {uploadPhase === "idle" && "Add photos below, then confirm to upload and analyze (AI + embedding)."}
                  {uploadPhase === "uploading" && "Step 1/2 — Uploading images…"}
                  {uploadPhase === "processing" && `Step 2/2 — Analyzing ${processProgress.completed}/${processProgress.total} items…`}
                  {uploadPhase === "done" && "All done!"}
                </p>
              </div>
              <div className="p-6 overflow-auto flex-1 min-h-0">
                {batchError && (
                  <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {batchError}
                  </div>
                )}
                {uploadPhase === "idle" && (
                  <>
                    {/* 已选中的衣服缩略图：最多 10 张，3 列，超出可滚动 */}
                    {pendingFiles.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-[#171412] mb-2">Selected ({pendingFiles.length}/{MAX_BATCH_FILES})</p>
                        <div className="grid grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto overflow-x-hidden pr-1">
                          {pendingFiles.map(({ id, file, previewUrl }) => (
                            <div key={id} className="relative group aspect-square w-full min-w-0 rounded-xl overflow-hidden border border-[#C9B89C] bg-stone-100 shadow-sm">
                              <img
                                src={previewUrl}
                                alt={file.name}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removePending(id)}
                                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/95 backdrop-blur-sm border border-[#C9B89C] text-[#171412] shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10 hover:bg-[#EDE0D4] hover:border-[#8B4513]"
                                aria-label="Remove"
                              >
                                <span className="material-symbols-outlined text-lg">close</span>
                              </button>
                              <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs truncate px-2 py-1 z-10">
                                {file.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* 同风格：点击上传 / 批量添加 */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={handleAddFilesClick}
                      onKeyDown={(e) => e.key === "Enter" && handleAddFilesClick()}
                      className={`rounded-2xl border-2 border-dashed border-[#C9B89C] bg-[#EDE0D4]/50 p-6 text-center cursor-pointer transition-all hover:border-[#8B4513] hover:bg-[#EDE0D4]/80 ${pendingFiles.length >= MAX_BATCH_FILES ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <span className="material-symbols-outlined text-4xl text-[#8B4513] mb-2 block">
                        add_photo_alternate
                      </span>
                      <p className="text-sm font-semibold text-[#171412]">
                        {pendingFiles.length >= MAX_BATCH_FILES
                          ? `Already ${MAX_BATCH_FILES} items`
                          : "Click to upload / Add more"}
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        JPG, PNG, WebP. Max {MAX_BATCH_FILES} per batch.
                      </p>
                    </div>
                  </>
                )}
                {uploadPhase === "uploading" && (
                  <div className="flex flex-col items-center justify-center py-10 gap-4">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-[#8B4513] animate-spin">
                        progress_activity
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-[#171412]">
                        Uploading {pendingFiles.length} photo{pendingFiles.length > 1 ? "s" : ""}…
                      </p>
                      <p className="text-sm text-stone-500 mt-1">Please wait while we upload your images</p>
                    </div>
                  </div>
                )}
                {uploadPhase === "processing" && (
                  <div className="flex flex-col items-center justify-center py-10 gap-6 w-full">
                    <div className="text-center">
                      <span className="material-symbols-outlined text-5xl text-[#8B4513] mb-3 block animate-pulse">
                        auto_awesome
                      </span>
                      <p className="font-semibold text-[#171412]">Analyzing with AI…</p>
                      <p className="text-sm text-stone-500 mt-1">
                        {processProgress.completed} / {processProgress.total} items completed
                      </p>
                    </div>
                    {processProgress.total > 0 && (
                      <div className="w-full px-2">
                        <div className="w-full bg-[#EDE0D4] rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-[#8B5E3C] h-3 rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: `${Math.round((processProgress.completed / processProgress.total) * 100)}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between mt-1.5">
                          <p className="text-xs text-stone-500">
                            {processProgress.completed < processProgress.total
                              ? "Generating tags & embeddings…"
                              : "Finishing up…"}
                          </p>
                          <p className="text-xs font-medium text-[#8B5E3C]">
                            {Math.round((processProgress.completed / processProgress.total) * 100)}%
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {uploadPhase === "done" && batchResult && (
                  <div className="space-y-3">
                    <p className="text-green-700 font-medium">
                      {batchResult.success.length} item(s) uploaded and analyzed.
                    </p>
                    {uploadWarnings.length > 0 && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm">
                        <p className="font-medium text-amber-800 mb-2">Note:</p>
                        <ul className="list-disc list-inside text-amber-700">
                          {uploadWarnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {batchResult.failed.length > 0 && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm">
                        <p className="font-medium text-amber-800 mb-2">{batchResult.failed.length} failed:</p>
                        <ul className="list-disc list-inside text-amber-700">
                          {batchResult.failed.map(({ id, error }) => (
                            <li key={id}>
                              <span className="font-mono text-xs">{id.slice(0, 8)}…</span>: {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-[#C9B89C] flex gap-3 justify-end">
                {uploadPhase === "idle" && (
                  <>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 rounded-lg border border-[#C9B89C] text-[#171412] hover:bg-[#EDE0D4]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmBatchUpload}
                      disabled={pendingFiles.length === 0}
                      className="px-4 py-2 rounded-lg bg-[#8B5E3C] text-white hover:bg-[#6F4A2F] disabled:opacity-50"
                    >
                      Confirm upload
                    </button>
                  </>
                )}
                {uploadPhase === "done" && (
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-lg bg-[#8B5E3C] text-white hover:bg-[#6F4A2F]"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 编辑单品弹窗：左图右参数 + Save + 右上 X */}
        {editModalItem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
            <div className="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-[#C9B89C]">
              <div className="flex flex-1 min-h-0">
                {/* 左侧：图片 */}
                <div className="flex-shrink-0 w-1/2 min-w-0 flex items-center justify-center bg-stone-100 p-4">
                  <img
                    src={editModalItem.imageUrl}
                    alt={editModalItem.name}
                    className="max-h-[70vh] w-auto object-contain rounded-xl"
                  />
                </div>
                {/* 右侧：参数 */}
                <div className="flex-1 flex flex-col min-w-0 p-6 border-l border-[#C9B89C]">
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm font-medium text-[#171412] mb-2">Category</p>
                      <div className="flex flex-wrap gap-2">
                        {EDIT_CATEGORIES.map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setEditDraft((d) => ({ ...d, category: value }))}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              editDraft.category === value
                                ? "bg-[#8B5E3C] text-white"
                                : "bg-[#EDE0D4]/50 border border-[#C9B89C] text-[#171412] hover:bg-[#EDE0D4]"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-[#171412] mb-2">Warmth (Level {editDraft.warmth})</p>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-stone-600 w-14 shrink-0">Light</span>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          value={editDraft.warmth}
                          onChange={(e) => setEditDraft((d) => ({ ...d, warmth: Number(e.target.value) }))}
                          className="w-44 h-2 shrink-0 rounded-full appearance-none bg-[#EDE0D4] accent-[#8B5E3C]"
                        />
                        <span className="text-sm text-stone-600 w-10 shrink-0">Warm</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-[#171412] mb-2">Formality (Level {editDraft.formality})</p>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-stone-600 w-14 shrink-0">Casual</span>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          value={editDraft.formality}
                          onChange={(e) => setEditDraft((d) => ({ ...d, formality: Number(e.target.value) }))}
                          className="w-44 h-2 shrink-0 rounded-full appearance-none bg-[#EDE0D4] accent-[#8B5E3C]"
                        />
                        <span className="text-sm text-stone-600 w-10 shrink-0">Formal</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={saveEditModal}
                      disabled={savingEdit}
                      className="px-6 py-2.5 rounded-lg bg-[#8B5E3C] text-white font-medium hover:bg-[#6F4A2F] disabled:opacity-50"
                    >
                      {savingEdit ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              </div>

              {/* 右上角圆形关闭 */}
              <button
                type="button"
                onClick={closeEditModal}
                className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center rounded-full bg-white/95 backdrop-blur-sm border border-[#C9B89C] text-[#171412] shadow-sm hover:bg-[#EDE0D4] hover:border-[#8B4513] z-10"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>
        )}

        {/* 删除确认弹窗 */}
        {deleteConfirmItem && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-[#C9B89C]">
              <p className="text-[#171412] mb-6">
                Are you sure you want to delete this item? This cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmItem(null)}
                  className="px-4 py-2 rounded-lg border border-[#C9B89C] text-[#171412] hover:bg-[#EDE0D4]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (deleteConfirmItem) {
                      handleRemove(deleteConfirmItem.id);
                      setDeleteConfirmItem(null);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-[#8B5E3C] text-white hover:bg-[#6F4A2F]"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => setSelectedCategory(value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                selectedCategory === value
                  ? "bg-[#8B5E3C] text-white"
                  : "bg-white border border-[#C9B89C] text-[#171412] hover:bg-[#EDE0D4]"
              }`}
            >
              <span className="material-symbols-outlined text-lg">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Wardrobe grid */}
        {loading ? (
          <div className="rounded-2xl border border-[#C9B89C] bg-[#EDE0D4]/30 p-16 text-center">
            <p className="text-stone-600">Loading wardrobe...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-[#C9B89C] bg-[#EDE0D4]/30 p-16 text-center">
            <span className="material-symbols-outlined text-6xl text-[#8B4513]/40 mb-4 block">
              checkroom
            </span>
            <p className="text-stone-600">
              {items.length === 0
                ? "No items yet. Upload your first piece!"
                : `No items in "${selectedCategory}" category.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => openEditModal(item)}
                onKeyDown={(e) => e.key === "Enter" && openEditModal(item)}
                className="group relative rounded-xl overflow-hidden border border-[#C9B89C] bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="aspect-square relative">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmItem(item);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/95 backdrop-blur-sm border border-[#C9B89C] text-[#171412] shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10 hover:bg-[#EDE0D4] hover:border-[#8B4513]"
                    aria-label="Delete"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
                <div className="px-2 py-1.5">
                  <p className="text-xs text-stone-500 capitalize text-center">
                    {item.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
