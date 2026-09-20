export type Tag = {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserSettings = {
  tagsEnabled: boolean;
};

export const defaultUserSettings: UserSettings = {
  tagsEnabled: false,
};

function createTagId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizeTag(value: unknown): Tag | null {
  if (!value || typeof value !== "object") return null;

  const tag = value as Record<string, unknown>;
  const valid =
    typeof tag.id === "string" &&
    typeof tag.name === "string" &&
    tag.name.trim().length > 0 &&
    (tag.parentId === null || typeof tag.parentId === "string") &&
    typeof tag.createdAt === "string" &&
    typeof tag.updatedAt === "string";

  if (!valid) return null;

  return {
    id: tag.id as string,
    name: (tag.name as string).trim(),
    parentId: tag.parentId as string | null,
    createdAt: tag.createdAt as string,
    updatedAt: tag.updatedAt as string,
  };
}

export function normalizeUserSettings(value: unknown): UserSettings {
  if (!value || typeof value !== "object") return { ...defaultUserSettings };

  const settings = value as Record<string, unknown>;
  return {
    tagsEnabled: typeof settings.tagsEnabled === "boolean" ? settings.tagsEnabled : false,
  };
}

export function createTag(name: string, parentId: string | null, existingTags: readonly Tag[]): Tag {
  const now = new Date().toISOString();
  return {
    id: createTagId(),
    name: name.trim(),
    parentId: existingTags.some((tag) => tag.id === parentId) ? parentId : null,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildTagPath(tagId: string, tags: readonly Tag[]): string {
  const tagMap = new Map(tags.map((tag) => [tag.id, tag]));
  const names: string[] = [];
  const visited = new Set<string>();
  let current = tagMap.get(tagId);

  while (current && !visited.has(current.id)) {
    names.unshift(current.name);
    visited.add(current.id);
    current = current.parentId ? tagMap.get(current.parentId) : undefined;
  }

  return names.join(" / ");
}

export function getDescendantTagIds(tagId: string, tags: readonly Tag[]): Set<string> {
  const descendants = new Set<string>([tagId]);
  let changed = true;

  while (changed) {
    changed = false;
    for (const tag of tags) {
      if (tag.parentId && descendants.has(tag.parentId) && !descendants.has(tag.id)) {
        descendants.add(tag.id);
        changed = true;
      }
    }
  }

  return descendants;
}

export function getTagDepth(tagId: string, tags: readonly Tag[]): number {
  const tagMap = new Map(tags.map((tag) => [tag.id, tag]));
  const visited = new Set<string>();
  let depth = 0;
  let current = tagMap.get(tagId);

  while (current?.parentId && !visited.has(current.id)) {
    visited.add(current.id);
    depth += 1;
    current = tagMap.get(current.parentId);
  }

  return depth;
}

export function sortTagsHierarchically(tags: readonly Tag[]): Tag[] {
  const childrenByParent = new Map<string | null, Tag[]>();

  for (const tag of tags) {
    const siblings = childrenByParent.get(tag.parentId) ?? [];
    siblings.push(tag);
    childrenByParent.set(tag.parentId, siblings);
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
  }

  const sorted: Tag[] = [];
  const visited = new Set<string>();

  function appendChildren(parentId: string | null) {
    for (const tag of childrenByParent.get(parentId) ?? []) {
      if (visited.has(tag.id)) continue;
      visited.add(tag.id);
      sorted.push(tag);
      appendChildren(tag.id);
    }
  }

  appendChildren(null);

  for (const tag of tags) {
    if (!visited.has(tag.id)) sorted.push(tag);
  }

  return sorted;
}
