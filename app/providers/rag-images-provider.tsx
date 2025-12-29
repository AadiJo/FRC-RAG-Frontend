"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { create } from "zustand";
import type { RAGImage } from "@/lib/rag";

// Store type definitions
type RAGImagesState = {
  // Map of message ID to its RAG image map (inline images)
  imageMapByMessageId: Record<string, RAGImage[]>;
  // Map of message ID to related images
  relatedImagesByMessageId: Record<string, RAGImage[]>;
  // Map of message ID to images skipped count
  imagesSkippedByMessageId: Record<string, number>;

  // Actions
  setImagesForMessage: (
    messageId: string,
    imageMap: RAGImage[],
    relatedImages: RAGImage[],
    skipped?: number
  ) => void;
  getImagesForMessage: (messageId: string) => {
    imageMap: RAGImage[];
    relatedImages: RAGImage[];
    skipped: number;
  };
  clearImagesForMessage: (messageId: string) => void;
  clearAll: () => void;
};

// Create the Zustand store
const createRAGImagesStore = () =>
  create<RAGImagesState>((set, get) => ({
    imageMapByMessageId: {},
    relatedImagesByMessageId: {},
    imagesSkippedByMessageId: {},

    setImagesForMessage: (messageId, imageMap, relatedImages, skipped = 0) =>
      set((state) => ({
        imageMapByMessageId: {
          ...state.imageMapByMessageId,
          [messageId]: imageMap,
        },
        relatedImagesByMessageId: {
          ...state.relatedImagesByMessageId,
          [messageId]: relatedImages,
        },
        imagesSkippedByMessageId: {
          ...state.imagesSkippedByMessageId,
          [messageId]: skipped,
        },
      })),

    getImagesForMessage: (messageId) => {
      const state = get();
      return {
        imageMap: state.imageMapByMessageId[messageId] ?? [],
        relatedImages: state.relatedImagesByMessageId[messageId] ?? [],
        skipped: state.imagesSkippedByMessageId[messageId] ?? 0,
      };
    },

    clearImagesForMessage: (messageId) =>
      set((state) => {
        const { [messageId]: _1, ...restImageMap } = state.imageMapByMessageId;
        const { [messageId]: _2, ...restRelated } =
          state.relatedImagesByMessageId;
        const { [messageId]: _3, ...restSkipped } =
          state.imagesSkippedByMessageId;
        return {
          imageMapByMessageId: restImageMap,
          relatedImagesByMessageId: restRelated,
          imagesSkippedByMessageId: restSkipped,
        };
      }),

    clearAll: () =>
      set({
        imageMapByMessageId: {},
        relatedImagesByMessageId: {},
        imagesSkippedByMessageId: {},
      }),
  }));

// Context type
type RAGImagesContextType = ReturnType<typeof createRAGImagesStore>;

// Context
const RAGImagesContext = createContext<RAGImagesContextType | null>(null);

// Provider props type
type RAGImagesProviderProps = {
  children: ReactNode;
};

export function RAGImagesProvider({ children }: RAGImagesProviderProps) {
  const store = useMemo(() => createRAGImagesStore(), []);

  return (
    <RAGImagesContext.Provider value={store}>
      {children}
    </RAGImagesContext.Provider>
  );
}

// Hook to access the store
export function useRAGImagesStore() {
  const store = useContext(RAGImagesContext);
  if (!store) {
    throw new Error("useRAGImagesStore must be used within RAGImagesProvider");
  }
  return store;
}

// Convenience hook to get images for a specific message
export function useRAGImagesForMessage(messageId: string) {
  const store = useRAGImagesStore();

  const images = store((state) => ({
    imageMap: state.imageMapByMessageId[messageId] ?? [],
    relatedImages: state.relatedImagesByMessageId[messageId] ?? [],
    skipped: state.imagesSkippedByMessageId[messageId] ?? 0,
  }));

  const setImages = useCallback(
    (imageMap: RAGImage[], relatedImages: RAGImage[], skipped?: number) => {
      store
        .getState()
        .setImagesForMessage(messageId, imageMap, relatedImages, skipped);
    },
    [store, messageId]
  );

  return { ...images, setImages };
}

// Hook to set images (for use in response handling)
export function useSetRAGImages() {
  const store = useRAGImagesStore();

  return useCallback(
    (
      messageId: string,
      imageMap: RAGImage[],
      relatedImages: RAGImage[],
      skipped?: number
    ) => {
      store
        .getState()
        .setImagesForMessage(messageId, imageMap, relatedImages, skipped);
    },
    [store]
  );
}
