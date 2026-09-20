import { beforeEach, describe, expect, it } from "vitest";

import type { Tag } from "../domain/tag";
import {
  LocalTagRepository,
  SETTINGS_STORAGE_KEY,
  TAGS_STORAGE_KEY,
} from "./localTagRepository";

const learning: Tag = {
  id: "learning",
  name: "学习",
  parentId: null,
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-20T00:00:00.000Z",
};

describe("LocalTagRepository", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts with tags disabled and no tags", async () => {
    const repository = new LocalTagRepository();

    await expect(repository.load()).resolves.toEqual({
      tags: [],
      settings: { tagsEnabled: false },
    });
  });

  it("saves and restores tags and settings independently", async () => {
    const repository = new LocalTagRepository();
    await repository.saveTags([learning]);
    await repository.saveSettings({ tagsEnabled: true });

    await expect(repository.load()).resolves.toEqual({
      tags: [learning],
      settings: { tagsEnabled: true },
    });
    expect(window.localStorage.getItem(TAGS_STORAGE_KEY)).toContain("学习");
    expect(window.localStorage.getItem(SETTINGS_STORAGE_KEY)).toContain("true");
  });
});
