/**
 * Virtual try-on model (avatar) context provider.
 * Manages the list of model photos for the authenticated user,
 * including fetching, uploading, updating (name/default flag), and deleting models.
 * Exposes a useModels() hook for consuming components.
 *
 * Uses TanStack Query for stale-while-revalidate caching:
 * - Data is served from cache instantly on re-mount / page switch
 * - Background refetch kicks in after staleTime (configured globally in providers.tsx)
 * - Mutations call invalidateQueries to trigger a background refresh
 */
"use client";

import React, { createContext, useContext, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchModels,
  uploadModel,
  updateModel,
  deleteModel,
} from "@/lib/db/queries/model.queries";
import type { ModelItem } from "@/types/model.types";

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
  const queryClient = useQueryClient();
  const queryKey = ["models", user?.id ?? null];

  const {
    data: models = [],
    isFetching,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchModels(user!.id),
    enabled: !!user?.id,
  });

  const loading = isFetching && models.length === 0;
  const error =
    queryError instanceof Error ? queryError.message : queryError ? String(queryError) : null;

  const reload = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const addModelMutation = useMutation({
    mutationFn: async ({
      file,
      name,
    }: {
      file: File;
      name?: string;
    }): Promise<ModelItem | null> => {
      if (!user?.id) return null;
      await uploadModel(user.id, file, name);
      const next = await fetchModels(user.id);
      return next[next.length - 1] ?? null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const addModel = useCallback(
    async (file: File, name?: string): Promise<ModelItem | null> => {
      if (!user?.id) return null;
      return addModelMutation.mutateAsync({ file, name });
    },
    [user?.id, addModelMutation]
  );

  const updateModelMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: { name?: string; isDefault?: boolean };
    }) => {
      await updateModel(id, {
        name: updates.name,
        is_default: updates.isDefault,
      });
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ModelItem[]>(queryKey);
      queryClient.setQueryData<ModelItem[]>(queryKey, (old = []) =>
        old.map((m) =>
          m.id === id
            ? {
                ...m,
                ...(updates.name !== undefined && { name: updates.name }),
                ...(updates.isDefault !== undefined && {
                  isDefault: updates.isDefault,
                }),
              }
            : updates.isDefault
            ? { ...m, isDefault: false }
            : m
        )
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateModelById = useCallback(
    async (
      id: string,
      updates: { name?: string; isDefault?: boolean }
    ): Promise<void> => {
      await updateModelMutation.mutateAsync({ id, updates });
    },
    [updateModelMutation]
  );

  const removeModelMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteModel(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ModelItem[]>(queryKey);
      queryClient.setQueryData<ModelItem[]>(queryKey, (old = []) =>
        old.filter((m) => m.id !== id)
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

  const removeModelById = useCallback(
    async (id: string): Promise<void> => {
      await removeModelMutation.mutateAsync(id);
    },
    [removeModelMutation]
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
        fetchModels: reload,
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
