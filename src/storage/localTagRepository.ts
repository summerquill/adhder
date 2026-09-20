import {
  defaultUserSettings,
  normalizeTag,
  normalizeUserSettings,
  type Tag,
  type UserSettings,
} from "../domain/tag";
import type { TagRepository, TagSettingsSnapshot } from "./TagRepository";

export const TAGS_STORAGE_KEY = "adhder.tags.v1";
export const SETTINGS_STORAGE_KEY = "adhder.settings.v1";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getDefaultStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export class LocalTagRepository implements TagRepository {
  constructor(private readonly storage: StorageLike | null = getDefaultStorage()) {}

  async load(): Promise<TagSettingsSnapshot> {
    return {
      tags: this.loadTags(),
      settings: this.loadSettings(),
    };
  }

  async saveTags(tags: readonly Tag[]): Promise<void> {
    if (!this.storage) return;
    this.storage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags));
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    if (!this.storage) return;
    this.storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }

  private loadTags(): Tag[] {
    if (!this.storage) return [];

    try {
      const saved = this.storage.getItem(TAGS_STORAGE_KEY);
      if (!saved) return [];
      const parsed: unknown = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];

      return parsed.map(normalizeTag).filter((tag): tag is Tag => tag !== null);
    } catch {
      return [];
    }
  }

  private loadSettings(): UserSettings {
    if (!this.storage) return { ...defaultUserSettings };

    try {
      const saved = this.storage.getItem(SETTINGS_STORAGE_KEY);
      if (!saved) return { ...defaultUserSettings };
      return normalizeUserSettings(JSON.parse(saved));
    } catch {
      return { ...defaultUserSettings };
    }
  }
}

export const localTagRepository = new LocalTagRepository();
