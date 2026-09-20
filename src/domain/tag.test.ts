import { describe, expect, it } from "vitest";

import {
  buildTagPath,
  createTag,
  defaultUserSettings,
  getDescendantTagIds,
  getTagDepth,
  normalizeUserSettings,
  sortTagsHierarchically,
  type Tag,
} from "./tag";

const learning: Tag = {
  id: "learning",
  name: "学习",
  parentId: null,
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-20T00:00:00.000Z",
};

const ai: Tag = {
  id: "ai",
  name: "AI",
  parentId: learning.id,
  createdAt: "2026-09-20T00:01:00.000Z",
  updatedAt: "2026-09-20T00:01:00.000Z",
};

describe("tag domain", () => {
  it("builds multi-level tag paths", () => {
    expect(buildTagPath(ai.id, [learning, ai])).toBe("学习 / AI");
    expect(getTagDepth(ai.id, [learning, ai])).toBe(1);
  });

  it("creates tags under an existing parent", () => {
    const tag = createTag("英语", learning.id, [learning]);

    expect(tag).toMatchObject({
      name: "英语",
      parentId: learning.id,
    });
  });

  it("keeps new module toggles when normalizing legacy settings", () => {
    expect(normalizeUserSettings({ tagsEnabled: true })).toEqual({
      ...defaultUserSettings,
      tagsEnabled: true,
    });
    expect(normalizeUserSettings({ energyEnabled: false }).energyEnabled).toBe(false);
    expect(normalizeUserSettings(null)).toEqual(defaultUserSettings);
  });

  it("finds descendants and sorts tags by hierarchy", () => {
    expect(Array.from(getDescendantTagIds(learning.id, [learning, ai]))).toEqual([
      learning.id,
      ai.id,
    ]);
    expect(sortTagsHierarchically([ai, learning]).map((tag) => tag.id)).toEqual([
      learning.id,
      ai.id,
    ]);
  });
});
