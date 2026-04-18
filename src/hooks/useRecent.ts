"use client";

import { useCallback, useEffect, useState } from "react";

export interface RecentItem {
  id: string;
  kind: "user" | "order" | "dispute" | "verification" | "delivery";
  label: string;
  href: string;
  at: number;
}

const KEY = "sellai.recent";
const MAX = 8;

function readStore(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function writeStore(items: RecentItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
    window.dispatchEvent(new CustomEvent("sellai:recent-changed"));
  } catch { /* quota */ }
}

export function pushRecent(item: Omit<RecentItem, "at">) {
  const items = readStore().filter((x) => x.href !== item.href);
  items.unshift({ ...item, at: Date.now() });
  writeStore(items);
}

export function useRecent() {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    setItems(readStore());
    const handler = () => setItems(readStore());
    window.addEventListener("sellai:recent-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("sellai:recent-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const clear = useCallback(() => writeStore([]), []);
  return { items, clear };
}
