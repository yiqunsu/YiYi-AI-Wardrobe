/**
 * Wardrobe management page [module: app / service / wardrobe]
 * Allows users to upload clothing photos in batch, browse their wardrobe by category,
 * edit item names, and delete items.
 *
 * Data fetching uses TanStack Query (useQuery / useMutation) for stale-while-revalidate
 * caching — wardrobe list is shown instantly from cache on re-visit, then refreshed in
 * the background. Mutations call invalidateQueries to keep the cache consistent.
 */
"use client";

import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/db/client";
import {
  updateWardrobeItem,
  deleteWardrobeItem,
} from "@/lib/db/queries/wardrobe.queries";
import type { WardrobeItem, WardrobeCategory } from "@/types/wardrobe.types";

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
type UploadProgress = { completed: number; total: number };

export default function WardrobePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["wardrobe", user?.id ?? null];

  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("all");
  const [pageError, setPageError] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ completed: 0, total: 0 });
  const [processProgress, setProcessProgress] = useState<ProcessProgress>({ completed: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editModalItem, setEditModalItem] = useState<WardrobeItem | null>(null);
  const [editDraft, setEditDraft] = useState<{
    name: string;
    category: WardrobeCategory;
    warmth: number;
    formality: number;
  }>({ name: "", category: "tops", warmth: 3, formality: 3 });
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<WardrobeItem | null>(null);

  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  const {
    data: items = [],
    isFetching,
    error: queryError,
  } = useQuery({
    queryKey,
    queryFn: async (): Promise<WardrobeItem[]> => {
      const token = await getToken();
      if (!token) return [];
      const res = await fetch("/api/wardrobe", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? "Failed to load wardrobe");
      }
      const data = await res.json();
      const list = Array.isArray(data?.items) ? data.items : [];
      return list.map(
        (item: Omit<WardrobeItem, "uploadedAt"> & { uploadedAt: string }) => ({
          ...item,
          uploadedAt: new Date(item.uploadedAt),
        })
      );
    },
    enabled: !!user?.id,
  });

  const loading = isFetching && items.length === 0;
  const error =
    pageError ??
    (queryError instanceof Error
      ? queryError.message
      : queryError
      ? String(queryError)
      : null);

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
    setUploadProgress({ completed: 0, total: 0 });
    setPageError(null);
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
        setPageError(`Maximum ${MAX_BATCH_FILES} images allowed. Some files were not added.`);
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
    setUploadProgress({ completed: 0, total: 0 });
  };

  const confirmBatchUpload = async () => {
    if (pendingFiles.length === 0 || !user?.id) return;

    const token = await getToken();
    if (!token) {
      setBatchError("Not signed in");
      return;
    }

    setBatchError(null);
    setUploadPhase("uploading");
    setUploadProgress({ completed: 0, total: pendingFiles.length });

    try {
      const formData = new FormData();
      pendingFiles.forEach(({ file }) => formData.append("files", file));

      const uploadRes = await fetch("/api/wardrobe/upload-batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      // Validation errors (4xx / 5xx before streaming starts) come back as plain JSON.
      if (!uploadRes.ok || !uploadRes.body) {
        const j = await uploadRes.json().catch(() => ({}));
        setBatchError(j?.error ?? "Upload failed");
        setUploadPhase("idle");
        return;
      }

      // Read the NDJSON stream and update upload progress in real-time.
      const uploadReader = uploadRes.body.getReader();
      const uploadDecoder = new TextDecoder();
      let uploadBuffer = "";
      let wardrobeItemIds: string[] = [];

      uploadOuter: while (true) {
        const { done, value } = await uploadReader.read();
        if (value) uploadBuffer += uploadDecoder.decode(value, { stream: true });
        if (done) uploadBuffer += uploadDecoder.decode();

        const lines = uploadBuffer.split("\n");
        uploadBuffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line) as Record<string, unknown>;
            if (event.type === "progress") {
              setUploadProgress({
                completed: event.completed as number,
                total: event.total as number,
              });
            } else if (event.type === "done") {
              wardrobeItemIds = (event.wardrobeItemIds as string[]) ?? [];
              const w = event.warnings as string[] | undefined;
              setUploadWarnings(Array.isArray(w) && w.length > 0 ? w : []);
              break uploadOuter;
            } else if (event.type === "error") {
              setBatchError((event.error as string) ?? "Upload failed");
              setUploadPhase("idle");
              return;
            }
          } catch {
            // skip malformed lines
          }
        }

        if (done) break;
      }

      if (!Array.isArray(wardrobeItemIds) || wardrobeItemIds.length === 0) {
        setUploadPhase("done");
        setBatchResult({ success: [], failed: [] });
        return;
      }

      setUploadPhase("processing");
      setProcessProgress({ completed: 0, total: wardrobeItemIds.length });

      // Send all IDs to the server in one request.  The server streams back
      // NDJSON progress events while the global concurrency limiter gates
      // actual Gemini calls to ≤ GEMINI_CONCURRENCY across all users.
      const processRes = await fetch("/api/wardrobe/process-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ wardrobeItemIds }),
      });

      if (!processRes.ok || !processRes.body) {
        const j = await processRes.json().catch(() => ({}));
        setBatchError(j?.error ?? "Processing failed");
        setUploadPhase("idle");
        return;
      }

      const reader = processRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const success: string[] = [];
      const failed: { id: string; error: string }[] = [];

      outer: while (true) {
        const { done, value } = await reader.read();
        if (value) buffer += decoder.decode(value, { stream: true });
        // Flush remaining bytes on stream end
        if (done) buffer += decoder.decode();

        const lines = buffer.split("\n");
        // Keep the last (possibly incomplete) line in the buffer
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line) as Record<string, unknown>;
            if (event.type === "progress") {
              const completed = event.completed as number;
              const total = event.total as number;
              setProcessProgress({ completed, total });
              if (event.ok) {
                success.push(event.id as string);
              } else {
                failed.push({
                  id: event.id as string,
                  error: (event.error as string) ?? "Processing failed",
                });
              }
            } else if (event.type === "done") {
              break outer;
            }
          } catch {
            // skip malformed lines
          }
        }

        if (done) break;
      }

      setUploadPhase("done");
      setBatchResult({ success, failed });
      queryClient.invalidateQueries({ queryKey });
    } catch (e) {
      setBatchError(e instanceof Error ? e.message : "Request failed");
      setUploadPhase("idle");
    }
  };

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => deleteWardrobeItem(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<WardrobeItem[]>(queryKey);
      queryClient.setQueryData<WardrobeItem[]>(queryKey, (old = []) =>
        old.filter((i) => i.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      setPageError("Delete failed");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const handleRemove = (id: string) => {
    setPageError(null);
    deleteItemMutation.mutate(id);
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

  const saveEditMutation = useMutation({
    mutationFn: async ({
      item,
      draft,
    }: {
      item: WardrobeItem;
      draft: { name: string; category: WardrobeCategory; warmth: number; formality: number };
    }) => {
      await updateWardrobeItem(item.id, {});
      const token = await getToken();
      if (token) {
        const res = await fetch("/api/wardrobe/update-metadata", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            wardrobeItemId: item.id,
            metadata: {
              category: draft.category,
              warmth: draft.warmth,
              formality: draft.formality,
              description: item.metadata?.description ?? "",
            },
          }),
        });
        if (!res.ok) {
          const j = await res.json();
          throw new Error(j?.error ?? "Failed to update metadata");
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setEditModalItem(null);
    },
    onError: (e) => {
      setPageError(e instanceof Error ? e.message : "Save failed");
    },
  });

  const savingEdit = saveEditMutation.isPending;

  const saveEditModal = async () => {
    if (!editModalItem) return;
    setPageError(null);
    saveEditMutation.mutate({ item: editModalItem, draft: editDraft });
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
                  <div className="flex flex-col items-center justify-center py-10 gap-6 w-full">
                    <div className="text-center">
                      <span className="material-symbols-outlined text-5xl text-[#8B4513] mb-3 block animate-spin">
                        cloud_upload
                      </span>
                      <p className="font-semibold text-[#171412]">Uploading images…</p>
                      <p className="text-sm text-stone-500 mt-1">
                        {uploadProgress.completed} / {uploadProgress.total} uploaded
                      </p>
                    </div>
                    {uploadProgress.total > 0 && (
                      <div className="w-full px-2">
                        <div className="w-full bg-[#EDE0D4] rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-[#8B5E3C] h-3 rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: `${Math.round((uploadProgress.completed / uploadProgress.total) * 100)}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between mt-1.5">
                          <p className="text-xs text-stone-500">Saving to wardrobe…</p>
                          <p className="text-xs font-medium text-[#8B5E3C]">
                            {Math.round((uploadProgress.completed / uploadProgress.total) * 100)}%
                          </p>
                        </div>
                      </div>
                    )}
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
          /* Loading skeleton */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-[#C9B89C] bg-white">
                <div className="aspect-square bg-[#EDE0D4] animate-pulse" />
                <div className="px-2 py-1.5">
                  <div className="h-3 w-12 mx-auto bg-[#EDE0D4] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          /* Empty wardrobe — first-time onboarding */
          <div className="rounded-2xl border-2 border-dashed border-[#C9B89C] bg-[#EDE0D4]/30 py-20 px-8 text-center">
            <span className="material-symbols-outlined text-7xl text-[#8B4513]/30 mb-6 block">
              checkroom
            </span>
            <h3 className="text-xl font-bold text-[#171412] mb-2">Your wardrobe is empty</h3>
            <p className="text-stone-500 text-sm max-w-sm mx-auto mb-8">
              Upload your first clothing photos and YiYi will analyze them with AI — ready to create personalized outfits for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center text-sm text-stone-400 mb-8">
              {[
                { icon: "cloud_upload", text: "Upload photos" },
                { icon: "auto_awesome", text: "AI analyzes style" },
                { icon: "checkroom", text: "Get outfit ideas" },
              ].map(({ icon, text }, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#8B4513]/60">{icon}</span>
                    <span>{text}</span>
                  </div>
                  {i < 2 && <span className="hidden sm:block text-[#C9B89C]">→</span>}
                </div>
              ))}
            </div>
            <button
              onClick={openUploadModal}
              className="px-8 py-3 bg-[#8B4513] text-white font-bold rounded-xl hover:bg-[#A0522D] transition-colors shadow-md"
            >
              Upload Your First Piece
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          /* Empty category filter */
          <div className="rounded-2xl border border-[#C9B89C] bg-[#EDE0D4]/30 p-16 text-center">
            <span className="material-symbols-outlined text-6xl text-[#8B4513]/40 mb-4 block">
              filter_list_off
            </span>
            <p className="font-semibold text-[#171412] mb-1">No items in this category</p>
            <p className="text-stone-500 text-sm">
              Switch to &ldquo;All&rdquo; or upload clothes in the &ldquo;{selectedCategory}&rdquo; category.
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
