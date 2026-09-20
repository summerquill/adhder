export const tagColors = ["teal", "blue", "purple", "amber", "rose", "slate"] as const;

export type TagColor = (typeof tagColors)[number];

export const tagColorLabels: Record<TagColor, string> = {
  teal: "青绿",
  blue: "蓝色",
  purple: "紫色",
  amber: "琥珀",
  rose: "玫红",
  slate: "灰色",
};

export const defaultTagColor: TagColor = "teal";

export type Tag = {
  id: string;
  name: string;
  parentId: string | null;
  color: TagColor;
  createdAt: string;
  updatedAt: string;
};

export type UserSettings = {
  tagsEnabled: boolean;
  nextStepEnabled: boolean;
  countdownPresets: number[];
  energyEnabled: boolean;
  celebrationSoundEnabled: boolean;
};

export const defaultCountdownPresets = [5, 10, 15];

export const defaultUserSettings: UserSettings = {
  tagsEnabled: false,
  nextStepEnabled: true,
  countdownPresets: [...defaultCountdownPresets],
  energyEnabled: true,
  celebrationSoundEnabled: true,
};

function createTagId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function isTagColor(value: unknown): value is TagColor {
  return typeof value === "string" && tagColors.includes(value as TagColor);
}

function pickTagColorFromId(id: string): TagColor {
  let hash = 0;

  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) % 9973;
  }

  return tagColors[hash % tagColors.length] ?? defaultTagColor;
}

export function normalizeTagColor(value: unknown, fallbackId: string): TagColor {
  return isTagColor(value) ? value : pickTagColorFromId(fallbackId);
}

export function getTagColor(tagId: string | null, tags: readonly Tag[]): TagColor | null {
  if (!tagId) return null;

  return tags.find((tag) => tag.id === tagId)?.color ?? null;
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
    color: normalizeTagColor(tag.color, tag.id as string),
    createdAt: tag.createdAt as string,
    updatedAt: tag.updatedAt as string,
  };
}

export function normalizeCountdownPresets(value: unknown): number[] {
  if (!Array.isArray(value)) return [...defaultCountdownPresets];

  const presets = Array.from(
    new Set(
      value.filter(
        (minutes): minutes is number =>
          typeof minutes === "number" &&
          Number.isInteger(minutes) &&
          minutes > 0 &&
          minutes <= 180,
      ),
    ),
  ).slice(0, 3);

  return presets.length > 0 ? presets : [...defaultCountdownPresets];
}

export function normalizeUserSettings(value: unknown): UserSettings {
  if (!value || typeof value !== "object") return { ...defaultUserSettings };

  const settings = value as Record<string, unknown>;
  return {
    tagsEnabled: typeof settings.tagsEnabled === "boolean" ? settings.tagsEnabled : false,
    nextStepEnabled: typeof settings.nextStepEnabled === "boolean" ? settings.nextStepEnabled : true,
    countdownPresets: normalizeCountdownPresets(settings.countdownPresets),
    energyEnabled: typeof settings.energyEnabled === "boolean" ? settings.energyEnabled : true,
    celebrationSoundEnabled:
      typeof settings.celebrationSoundEnabled === "boolean"
        ? settings.celebrationSoundEnabled
        : true,
  };
}

export function createTag(
  name: string,
  parentId: string | null,
  existingTags: readonly Tag[],
  color?: TagColor,
): Tag {
  const now = new Date().toISOString();
  const id = createTagId();
  const parent = existingTags.find((tag) => tag.id === parentId) ?? null;

  return {
    id,
    name: name.trim(),
    parentId: parent ? parent.id : null,
    // 未指定颜色时跟随父标签，保证同一分支视觉一致
    color: color ?? parent?.color ?? pickTagColorFromId(id),
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

export function getAncestorTagIds(tagId: string, tags: readonly Tag[]): string[] {
  const tagMap = new Map(tags.map((tag) => [tag.id, tag]));
  const ancestors: string[] = [];
  const visited = new Set<string>();
  let current = tagMap.get(tagId);

  while (current?.parentId && !visited.has(current.id)) {
    visited.add(current.id);
    ancestors.unshift(current.parentId);
    current = tagMap.get(current.parentId);
  }

  return ancestors;
}

export function hasChildTags(tagId: string, tags: readonly Tag[]): boolean {
  return tags.some((tag) => tag.parentId === tagId);
}

export function getVisibleTags(
  tags: readonly Tag[],
  expandedTagIds: ReadonlySet<string>,
): Tag[] {
  return sortTagsHierarchically(tags).filter((tag) =>
    getAncestorTagIds(tag.id, tags).every((ancestorId) => expandedTagIds.has(ancestorId)),
  );
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
