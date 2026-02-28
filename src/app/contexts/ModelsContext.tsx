"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  fetchModels,
  uploadModel,
  updateModel,
  deleteModel,
  type ModelItem,
} from "@/lib/supabase-data";

interface ModelsContextType {
  models: ModelItem[];
  loading: boolean;
  error: string | null;
  fetchModels: () => Promise<void>;
  addModel: (file: File, name?: string) => Promise<ModelItem | null>;
  updateModel: (
    id: string,
    updates: { name?: string; isDefault?: boolean }
  ) => Promise<void>;
  removeModel: (id: string) => Promise<void>;
  getDefaultModelId: () => string | null;
}

const ModelsContext = createContext<ModelsContextType | undefined>(undefined);

export type { ModelItem };

export function ModelsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [models, setModels] = useState<ModelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) {
      setModels([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchModels(user.id);
      setModels(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load models");
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const addModel = useCallback(
    async (file: File, name?: string): Promise<ModelItem | null> => {
      if (!user?.id) return null;
      setError(null);
      try {
        await uploadModel(user.id, file, name);
        await load();
        const next = await fetchModels(user.id);
        return next[next.length - 1] ?? null;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
        return null;
      }
    },
    [user?.id, load]
  );

  const updateModelById = useCallback(
    async (
      id: string,
      updates: { name?: string; isDefault?: boolean }
    ): Promise<void> => {
      setError(null);
      try {
        await updateModel(id, {
          name: updates.name,
          is_default: updates.isDefault,
        });
        if (user?.id) {
          const data = await fetchModels(user.id);
          setModels(data);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Update failed");
      }
    },
    [user?.id]
  );

  const removeModelById = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      try {
        await deleteModel(id);
        setModels((prev) => prev.filter((m) => m.id !== id));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    },
    []
  );

  const getDefaultModelId = useCallback(() => {
    const defaultModel = models.find((m) => m.isDefault);
    return defaultModel?.id ?? models[0]?.id ?? null;
  }, [models]);

  return (
    <ModelsContext.Provider
      value={{
        models,
        loading,
        error,
        fetchModels: load,
        addModel,
        updateModel: updateModelById,
        removeModel: removeModelById,
        getDefaultModelId,
      }}
    >
      {children}
    </ModelsContext.Provider>
  );
}

export function useModels() {
  const ctx = useContext(ModelsContext);
  if (ctx === undefined) {
    throw new Error("useModels must be used within ModelsProvider");
  }
  return ctx;
}
