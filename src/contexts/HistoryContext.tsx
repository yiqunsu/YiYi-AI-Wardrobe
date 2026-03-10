/**
 * Outfit generation history context provider.
 * Manages the list of past outfit generations for the authenticated user,
 * including fetching, adding, liking/unliking, and deleting history items.
 * Exposes a useHistory() hook for consuming components.
 *
 * Uses TanStack Query for stale-while-revalidate caching:
 * - Data is served from cache instantly on re-mount / page switch
 * - Mutations use optimistic updates for snappy UI, then invalidate to sync with DB
 */
"use client";

import React, { createContext, useContext, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchOutfitGenerations,
  addOutfitGeneration,
  toggleOutfitLike,
  deleteOutfitGeneration,
} from "@/lib/db/queries/outfit.queries";
import type { HistoryItem, AddOutfitGenerationInput } from "@/types/outfit.types";

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
  const queryClient = useQueryClient();
  const queryKey = ["history", user?.id ?? null];

  const {
    data: historyItems = [],
    isFetching,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchOutfitGenerations(user!.id),
    enabled: !!user?.id,
  });

  const loading = isFetching && historyItems.length === 0;
  const error =
    queryError instanceof Error ? queryError.message : queryError ? String(queryError) : null;

  const fetchHistory = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const addHistoryMutation = useMutation({
    mutationFn: async (item: Omit<HistoryItem, "id">) => {
      if (!user?.id) return;
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const addHistoryItem = useCallback(
    async (item: Omit<HistoryItem, "id">): Promise<void> => {
      await addHistoryMutation.mutateAsync(item);
    },
    [addHistoryMutation]
  );

  const toggleLikeMutation = useMutation({
    mutationFn: async (id: string) => {
      return toggleOutfitLike(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<HistoryItem[]>(queryKey);
      queryClient.setQueryData<HistoryItem[]>(queryKey, (old = []) =>
        old.map((h) => (h.id === id ? { ...h, isLiked: !h.isLiked } : h))
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const toggleLike = useCallback(
    async (id: string): Promise<void> => {
      await toggleLikeMutation.mutateAsync(id);
    },
    [toggleLikeMutation]
  );

  const deleteHistoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteOutfitGeneration(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<HistoryItem[]>(queryKey);
      queryClient.setQueryData<HistoryItem[]>(queryKey, (old = []) =>
        old.filter((h) => h.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteHistoryItem = useCallback(
    async (id: string): Promise<void> => {
      await deleteHistoryMutation.mutateAsync(id);
    },
    [deleteHistoryMutation]
  );

  return (
    <HistoryContext.Provider
      value={{
        historyItems,
        loading,
        error,
        fetchHistory,
        addHistoryItem,
        toggleLike,
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
