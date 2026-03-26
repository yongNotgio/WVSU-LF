"use client";

import { useEffect, useState } from "react";

interface StoredChatHeads {
  openChatIds: string[];
  minimizedChatIds: string[];
}

const EMPTY_STATE: StoredChatHeads = {
  openChatIds: [],
  minimizedChatIds: [],
};

export function usePersistentChatHeads(storageKey: string) {
  const [openChatIds, setOpenChatIds] = useState<string[]>([]);
  const [minimizedChatIds, setMinimizedChatIds] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setOpenChatIds([]);
        setMinimizedChatIds([]);
        setIsHydrated(true);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<StoredChatHeads>;
      setOpenChatIds(Array.isArray(parsed.openChatIds) ? parsed.openChatIds : []);
      setMinimizedChatIds(
        Array.isArray(parsed.minimizedChatIds) ? parsed.minimizedChatIds : []
      );
    } catch {
      setOpenChatIds(EMPTY_STATE.openChatIds);
      setMinimizedChatIds(EMPTY_STATE.minimizedChatIds);
    } finally {
      setIsHydrated(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!isHydrated) return;

    const payload: StoredChatHeads = {
      openChatIds,
      minimizedChatIds,
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [isHydrated, minimizedChatIds, openChatIds, storageKey]);

  return {
    openChatIds,
    setOpenChatIds,
    minimizedChatIds,
    setMinimizedChatIds,
    isHydrated,
  };
}
