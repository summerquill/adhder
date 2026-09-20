import type { ComfortEntry, ComfortItem } from "../domain/comfort";

export type ComfortSnapshot = {
  items: ComfortItem[];
  entries: ComfortEntry[];
};

export interface ComfortRepository {
  load(): Promise<ComfortSnapshot>;
  saveItems(items: readonly ComfortItem[]): Promise<void>;
  saveEntries(entries: readonly ComfortEntry[]): Promise<void>;
}
