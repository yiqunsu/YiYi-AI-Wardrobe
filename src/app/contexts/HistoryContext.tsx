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
  fetchOutfitGenerations,
  addOutfitGeneration,
  toggleOutfitLike,
  deleteOutfitGeneration,
  type HistoryItem,
  type AddOutfitGenerationInput,
} from "@/lib/supabase-data";

interface HistoryContextType {
  historyItems: HistoryItem[];
  loading: boolean;
  error: string | null;
  fetchHistory: () => Promise<void>;
  addHistoryItem: (item: Omit<HistoryItem, "id">) => Promise<void>;
  toggleLike: (id: string) => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<void>;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export type { HistoryItem };

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) {
      setHistoryItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOutfitGenerations(user.id);
      setHistoryItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load history");
      setHistoryItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const addHistoryItem = useCallback(
    async (item: Omit<HistoryItem, "id">): Promise<void> => {
      if (!user?.id) return;
      setError(null);
      try {
        const input: AddOutfitGenerationInput = {
          location: item.location,
          occasion: item.occasion,
          occasionDate:
            item.date instanceof Date ? item.date : new Date(item.date),
          resultMessage: item.message ?? null,
          resultDescription: item.description ?? null,
          resultImagePath: item.imageUrl ?? null,
        };
        await addOutfitGeneration(user.id, input);
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    },
    [user?.id, load]
  );

  const toggleLikeById = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      const next = await toggleOutfitLike(id);
      setHistoryItems((prev) =>
        prev.map((h) => (h.id === id ? { ...h, isLiked: next } : h))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    }
  }, []);

  const deleteHistoryItem = useCallback(async (id: string): Promise<void> => {
    setError(null);
    setHistoryItems((prev) => prev.filter((h) => h.id !== id));
    try {
      await deleteOutfitGeneration(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
      await load();
    }
  }, [load]);

  return (
    <HistoryContext.Provider
      value={{
        historyItems,
        loading,
        error,
        fetchHistory: load,
        addHistoryItem,
        toggleLike: toggleLikeById,
        deleteHistoryItem,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (ctx === undefined) {
    throw new Error("useHistory must be used within HistoryProvider");
  }
  return ctx;
}
