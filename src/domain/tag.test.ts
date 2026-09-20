import { describe, expect, it } from "vitest";

import {
  buildTagPath,
  createTag,
  defaultUserSettings,
  getAncestorTagIds,
  getDescendantTagIds,
  getTagDepth,
  getVisibleTags,
  hasChildTags,
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

  it("reveals child tags only after their parent is expanded", () => {
    const advanced: Tag = {
      id: "advanced",
      name: "进阶",
      parentId: ai.id,
      createdAt: "2026-09-20T00:02:00.000Z",
      updatedAt: "2026-09-20T00:02:00.000Z",
    };
    const all = [learning, ai, advanced];

    expect(getAncestorTagIds(advanced.id, all)).toEqual([learning.id, ai.id]);
    expect(hasChildTags(learning.id, all)).toBe(true);
    expect(hasChildTags(advanced.id, all)).toBe(false);

    expect(getVisibleTags(all, new Set()).map((tag) => tag.id)).toEqual([learning.id]);
    expect(getVisibleTags(all, new Set([learning.id])).map((tag) => tag.id)).toEqual([
      learning.id,
      ai.id,
    ]);
    expect(getVisibleTags(all, new Set([learning.id, ai.id])).map((tag) => tag.id)).toEqual([
      learning.id,
      ai.id,
      advanced.id,
    ]);
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
