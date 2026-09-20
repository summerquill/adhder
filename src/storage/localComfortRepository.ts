import {
  normalizeComfortEntries,
  normalizeComfortItems,
  type ComfortEntry,
  type ComfortItem,
} from "../domain/comfort";
import type { ComfortRepository, ComfortSnapshot } from "./ComfortRepository";

export const COMFORT_ITEMS_STORAGE_KEY = "adhder.comfortItems.v1";
export const COMFORT_ENTRIES_STORAGE_KEY = "adhder.comfortEntries.v1";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getDefaultStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function readArray(storage: StorageLike, key: string): unknown[] {
  try {
    const saved = storage.getItem(key);
    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export class LocalComfortRepository implements ComfortRepository {
  constructor(private readonly storage: StorageLike | null = getDefaultStorage()) {}

  async load(): Promise<ComfortSnapshot> {
    return {
      items: this.loadItems(),
      entries: this.loadEntries(),
    };
  }

  async saveItems(items: readonly ComfortItem[]): Promise<void> {
    if (!this.storage) return;
    this.storage.setItem(COMFORT_ITEMS_STORAGE_KEY, JSON.stringify(items));
  }

  async saveEntries(entries: readonly ComfortEntry[]): Promise<void> {
    if (!this.storage) return;
    this.storage.setItem(COMFORT_ENTRIES_STORAGE_KEY, JSON.stringify(entries));
  }

  private loadItems(): ComfortItem[] {
    if (!this.storage) return [];
    return normalizeComfortItems(readArray(this.storage, COMFORT_ITEMS_STORAGE_KEY));
  }

  private loadEntries(): ComfortEntry[] {
    if (!this.storage) return [];
    return normalizeComfortEntries(readArray(this.storage, COMFORT_ENTRIES_STORAGE_KEY));
  }
}

export const localComfortRepository = new LocalComfortRepository();
