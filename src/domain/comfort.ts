import { getLocalDateKey, isDateKey } from "./calendar";

export const comfortEfforts = ["low", "medium", "high"] as const;

export type ComfortEffort = (typeof comfortEfforts)[number];

export const comfortEffortLabels: Record<ComfortEffort, string> = {
  low: "轻",
  medium: "中",
  high: "重",
};

export const defaultComfortEffort: ComfortEffort = "medium";

const comfortEffortRank: Record<ComfortEffort, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

export type ComfortItem = {
  id: string;
  title: string;
  effort: ComfortEffort;
  howTo?: string;
  createdAt: string;
  updatedAt: string;
};

export type ComfortEntry = {
  id: string;
  itemId: string;
  dateKey: string;
  adoptedAt: string;
  completedAt: string | null;
  note?: string;
  mediaRefs: string[];
};

function createComfortId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeOptionalText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeMediaRefs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(value.filter((ref): ref is string => typeof ref === "string" && ref.length > 0)),
  );
}

export function isComfortEffort(value: unknown): value is ComfortEffort {
  return typeof value === "string" && comfortEfforts.includes(value as ComfortEffort);
}

export function normalizeComfortEffort(value: unknown): ComfortEffort {
  return isComfortEffort(value) ? value : defaultComfortEffort;
}

export function normalizeComfortItem(value: unknown): ComfortItem | null {
  if (!value || typeof value !== "object") return null;

  const item = value as Record<string, unknown>;
  const title = normalizeOptionalText(item.title);
  const isValid =
    typeof item.id === "string" &&
    item.id.length > 0 &&
    Boolean(title) &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string";

  if (!isValid) return null;

  const normalized: ComfortItem = {
    id: item.id as string,
    title: title as string,
    effort: normalizeComfortEffort(item.effort),
    createdAt: item.createdAt as string,
    updatedAt: item.updatedAt as string,
  };

  const howTo = normalizeOptionalText(item.howTo);
  if (howTo) normalized.howTo = howTo;

  return normalized;
}

export function normalizeComfortItems(value: unknown): ComfortItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(normalizeComfortItem)
    .filter((item): item is ComfortItem => item !== null);
}

export function normalizeComfortEntry(value: unknown): ComfortEntry | null {
  if (!value || typeof value !== "object") return null;

  const entry = value as Record<string, unknown>;
  const isValid =
    typeof entry.id === "string" &&
    entry.id.length > 0 &&
    typeof entry.itemId === "string" &&
    entry.itemId.length > 0 &&
    isDateKey(entry.dateKey) &&
    typeof entry.adoptedAt === "string" &&
    entry.adoptedAt.length > 0;

  if (!isValid) return null;

  const normalized: ComfortEntry = {
    id: entry.id as string,
    itemId: entry.itemId as string,
    dateKey: entry.dateKey as string,
    adoptedAt: entry.adoptedAt as string,
    completedAt:
      typeof entry.completedAt === "string" && entry.completedAt.length > 0
        ? entry.completedAt
        : null,
    mediaRefs: normalizeMediaRefs(entry.mediaRefs),
  };

  const note = normalizeOptionalText(entry.note);
  if (note) normalized.note = note;

  return normalized;
}

export function normalizeComfortEntries(value: unknown): ComfortEntry[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(normalizeComfortEntry)
    .filter((entry): entry is ComfortEntry => entry !== null);
}

export type CreateComfortItemOptions = {
  effort?: ComfortEffort;
  howTo?: string;
  createdAt?: string;
};

export function createComfortItem(
  title: string,
  options: CreateComfortItemOptions = {},
): ComfortItem {
  const now = options.createdAt ?? new Date().toISOString();
  const item: ComfortItem = {
    id: createComfortId(),
    title: title.trim(),
    effort: normalizeComfortEffort(options.effort),
    createdAt: now,
    updatedAt: now,
  };

  const howTo = normalizeOptionalText(options.howTo);
  if (howTo) item.howTo = howTo;

  return item;
}

export function updateComfortItem(
  item: ComfortItem,
  patch: Partial<Omit<ComfortItem, "id" | "createdAt">>,
): ComfortItem {
  return {
    ...item,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}

export type CreateComfortEntryOptions = {
  dateKey?: string;
  adoptedAt?: string;
};

export function createComfortEntry(
  itemId: string,
  options: CreateComfortEntryOptions = {},
): ComfortEntry {
  return {
    id: createComfortId(),
    itemId,
    dateKey: options.dateKey ?? getLocalDateKey(),
    adoptedAt: options.adoptedAt ?? new Date().toISOString(),
    completedAt: null,
    mediaRefs: [],
  };
}

export function updateComfortEntry(
  entry: ComfortEntry,
  patch: Partial<Omit<ComfortEntry, "id" | "itemId" | "dateKey" | "adoptedAt">>,
): ComfortEntry {
  return {
    ...entry,
    ...patch,
  };
}

export function completeComfortEntry(entry: ComfortEntry, completedAt?: string): ComfortEntry {
  if (entry.completedAt) return entry;

  return {
    ...entry,
    completedAt: completedAt ?? new Date().toISOString(),
  };
}

export function isComfortEntryCompleted(entry: ComfortEntry): boolean {
  return entry.completedAt !== null;
}

export function getComfortEntriesForDate(
  entries: readonly ComfortEntry[],
  dateKey: string,
): ComfortEntry[] {
  return entries
    .filter((entry) => entry.dateKey === dateKey)
    .sort((left, right) => left.adoptedAt.localeCompare(right.adoptedAt));
}

export function getPendingComfortEntries(
  entries: readonly ComfortEntry[],
  dateKey: string,
): ComfortEntry[] {
  return getComfortEntriesForDate(entries, dateKey).filter(
    (entry) => !isComfortEntryCompleted(entry),
  );
}

export function getRecentComfortItemIds(
  entries: readonly ComfortEntry[],
  limit = 3,
): string[] {
  const ordered = [...entries].sort((left, right) =>
    right.adoptedAt.localeCompare(left.adoptedAt),
  );
  const recent: string[] = [];

  for (const entry of ordered) {
    if (recent.includes(entry.itemId)) continue;

    recent.push(entry.itemId);
    if (recent.length >= limit) break;
  }

  return recent;
}

export type PickComfortItemOptions = {
  maxEffort?: ComfortEffort;
  excludeItemIds?: readonly string[];
  random?: () => number;
};

export function pickComfortItem(
  items: readonly ComfortItem[],
  options: PickComfortItemOptions = {},
): ComfortItem | null {
  const random = options.random ?? Math.random;
  const maxRank = options.maxEffort ? comfortEffortRank[options.maxEffort] : Infinity;

  function eligible(excludedIds: ReadonlySet<string>): ComfortItem[] {
    return items.filter(
      (item) => !excludedIds.has(item.id) && comfortEffortRank[item.effort] <= maxRank,
    );
  }

  const excludedIds = new Set(options.excludeItemIds ?? []);
  let candidates = eligible(excludedIds);

  if (candidates.length === 0 && excludedIds.size > 0) {
    candidates = eligible(new Set());
  }

  if (candidates.length === 0) return null;

  const index = Math.min(candidates.length - 1, Math.floor(random() * candidates.length));
  return candidates[index] ?? null;
}
