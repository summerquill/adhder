import type { Tag, UserSettings } from "../domain/tag";

export type TagSettingsSnapshot = {
  tags: Tag[];
  settings: UserSettings;
};

export interface TagRepository {
  load(): Promise<TagSettingsSnapshot>;
  saveTags(tags: readonly Tag[]): Promise<void>;
  saveSettings(settings: UserSettings): Promise<void>;
}
