import { describe, expect, it } from "vitest";

import {
  completeComfortEntry,
  createComfortEntry,
  createComfortItem,
  getComfortEntriesForDate,
  getPendingComfortEntries,
  getRecentComfortItemIds,
  isComfortEntryCompleted,
  normalizeComfortEntries,
  normalizeComfortEntry,
  normalizeComfortItem,
  normalizeComfortItems,
  pickComfortItem,
  updateComfortItem,
  type ComfortEntry,
  type ComfortItem,
} from "./comfort";

const water: ComfortItem = {
  id: "comfort-1",
  title: "喝杯热水",
  effort: "low",
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-20T00:00:00.000Z",
};

const walk: ComfortItem = {
  id: "comfort-2",
  title: "出门走走",
  effort: "high",
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-20T00:00:00.000Z",
};

function makeEntry(overrides: Partial<ComfortEntry> = {}): ComfortEntry {
  return {
    id: "entry-1",
    itemId: water.id,
    dateKey: "2026-09-20",
    adoptedAt: "2026-09-20T01:00:00.000Z",
    completedAt: null,
    mediaRefs: [],
    ...overrides,
  };
}

describe("comfort domain", () => {
  it("normalizes items and defaults unknown effort to medium", () => {
    expect(
      normalizeComfortItem({
        id: "comfort-3",
        title: "  听一首歌  ",
        effort: "unknown",
        howTo: "  戴上耳机  ",
        createdAt: "2026-09-20T00:00:00.000Z",
        updatedAt: "2026-09-20T00:00:00.000Z",
      }),
    ).toEqual({
      id: "comfort-3",
      title: "听一首歌",
      effort: "medium",
      howTo: "戴上耳机",
      createdAt: "2026-09-20T00:00:00.000Z",
      updatedAt: "2026-09-20T00:00:00.000Z",
    });
  });

  it("rejects items without required fields", () => {
    expect(normalizeComfortItem(null)).toBeNull();
    expect(normalizeComfortItem({ ...water, title: "   " })).toBeNull();
    expect(normalizeComfortItem({ ...water, id: "" })).toBeNull();
    expect(normalizeComfortItem({ ...water, createdAt: 1 })).toBeNull();
    expect(normalizeComfortItems([water, { id: "bad" }, walk])).toEqual([water, walk]);
    expect(normalizeComfortItems("not-an-array")).toEqual([]);
  });

  it("creates items with trimmed title and matching timestamps", () => {
    const item = createComfortItem("  洗个热水澡  ", {
      effort: "low",
      howTo: "  先放水  ",
      createdAt: "2026-09-20T08:00:00.000Z",
    });

    expect(item).toMatchObject({
      title: "洗个热水澡",
      effort: "low",
      howTo: "先放水",
      createdAt: "2026-09-20T08:00:00.000Z",
      updatedAt: "2026-09-20T08:00:00.000Z",
    });
    expect(item.id).toBeTruthy();
    expect(createComfortItem("发会儿呆").effort).toBe("medium");
  });

  it("updates items and refreshes updatedAt", () => {
    const updated = updateComfortItem(water, { title: "喝杯温水" });

    expect(updated.title).toBe("喝杯温水");
    expect(updated.createdAt).toBe(water.createdAt);
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(water.updatedAt).getTime(),
    );
  });

  it("normalizes entries and defaults optional fields", () => {
    expect(
      normalizeComfortEntry({
        id: "entry-2",
        itemId: water.id,
        dateKey: "2026-09-20",
        adoptedAt: "2026-09-20T02:00:00.000Z",
        mediaRefs: ["photo-1", "photo-1", 7],
      }),
    ).toEqual({
      id: "entry-2",
      itemId: water.id,
      dateKey: "2026-09-20",
      adoptedAt: "2026-09-20T02:00:00.000Z",
      completedAt: null,
      mediaRefs: ["photo-1"],
    });

    expect(normalizeComfortEntry({ ...makeEntry(), dateKey: "2026/09/20" })).toBeNull();
    expect(normalizeComfortEntries([makeEntry(), { id: "bad" }])).toEqual([makeEntry()]);
  });

  it("creates pending entries and completes them once", () => {
    const entry = createComfortEntry(water.id, {
      dateKey: "2026-09-20",
      adoptedAt: "2026-09-20T03:00:00.000Z",
    });

    expect(entry).toMatchObject({
      itemId: water.id,
      dateKey: "2026-09-20",
      completedAt: null,
      mediaRefs: [],
    });
    expect(isComfortEntryCompleted(entry)).toBe(false);

    const completed = completeComfortEntry(entry, "2026-09-20T03:05:00.000Z");
    expect(isComfortEntryCompleted(completed)).toBe(true);
    expect(completed.completedAt).toBe("2026-09-20T03:05:00.000Z");
    expect(completeComfortEntry(completed, "2026-09-20T04:00:00.000Z")).toEqual(completed);
    expect(createComfortEntry(water.id).dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("filters entries by date and completion state", () => {
    const later = makeEntry({ id: "entry-later", adoptedAt: "2026-09-20T09:00:00.000Z" });
    const done = makeEntry({
      id: "entry-done",
      adoptedAt: "2026-09-20T02:00:00.000Z",
      completedAt: "2026-09-20T10:00:00.000Z",
    });
    const otherDay = makeEntry({ id: "entry-other", dateKey: "2026-09-21" });

    expect(
      getComfortEntriesForDate([later, done, otherDay, makeEntry()], "2026-09-20").map(
        (entry) => entry.id,
      ),
    ).toEqual(["entry-1", "entry-done", "entry-later"]);
    expect(getPendingComfortEntries([later, done], "2026-09-20").map((entry) => entry.id)).toEqual([
      "entry-later",
    ]);
  });

  it("collects recently used item ids without duplicates", () => {
    const entries = [
      makeEntry({ id: "e1", itemId: "a", adoptedAt: "2026-09-20T01:00:00.000Z" }),
      makeEntry({ id: "e2", itemId: "b", adoptedAt: "2026-09-20T02:00:00.000Z" }),
      makeEntry({ id: "e3", itemId: "a", adoptedAt: "2026-09-20T03:00:00.000Z" }),
      makeEntry({ id: "e4", itemId: "c", adoptedAt: "2026-09-20T04:00:00.000Z" }),
    ];

    expect(getRecentComfortItemIds(entries, 2)).toEqual(["c", "a"]);
    expect(getRecentComfortItemIds(entries)).toEqual(["c", "a", "b"]);
  });

  it("picks comfort items within the effort budget", () => {
    expect(pickComfortItem([water, walk], { maxEffort: "low" })).toEqual(water);
    expect(pickComfortItem([walk], { maxEffort: "low" })).toBeNull();
    expect(pickComfortItem([], {})).toBeNull();
    expect(pickComfortItem([water, walk], { random: () => 0.99 })).toEqual(walk);
  });

  it("avoids recently used items but still picks when everything was used", () => {
    expect(pickComfortItem([water, walk], { excludeItemIds: [water.id] })).toEqual(walk);
    expect(pickComfortItem([water], { excludeItemIds: [water.id] })).toEqual(water);
  });
});
