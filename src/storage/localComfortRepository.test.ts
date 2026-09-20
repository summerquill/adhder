import { beforeEach, describe, expect, it } from "vitest";

import type { ComfortEntry, ComfortItem } from "../domain/comfort";
import {
  COMFORT_ENTRIES_STORAGE_KEY,
  COMFORT_ITEMS_STORAGE_KEY,
  LocalComfortRepository,
} from "./localComfortRepository";

const water: ComfortItem = {
  id: "comfort-1",
  title: "喝杯热水",
  effort: "low",
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-20T00:00:00.000Z",
};

const entry: ComfortEntry = {
  id: "entry-1",
  itemId: water.id,
  dateKey: "2026-09-20",
  adoptedAt: "2026-09-20T01:00:00.000Z",
  completedAt: null,
  mediaRefs: [],
};

describe("LocalComfortRepository", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts empty and round-trips items and entries independently", async () => {
    const repository = new LocalComfortRepository();

    await expect(repository.load()).resolves.toEqual({ items: [], entries: [] });

    await repository.saveItems([water]);
    await repository.saveEntries([entry]);

    await expect(repository.load()).resolves.toEqual({ items: [water], entries: [entry] });
    expect(window.localStorage.getItem(COMFORT_ITEMS_STORAGE_KEY)).toContain("喝杯热水");
    expect(window.localStorage.getItem(COMFORT_ENTRIES_STORAGE_KEY)).toContain("comfort-1");
  });

  it("filters invalid entries and falls back on corrupt data", async () => {
    const repository = new LocalComfortRepository();

    window.localStorage.setItem(COMFORT_ITEMS_STORAGE_KEY, JSON.stringify([water, { id: "bad" }]));
    window.localStorage.setItem(
      COMFORT_ENTRIES_STORAGE_KEY,
      JSON.stringify([entry, { id: "bad" }]),
    );
    await expect(repository.load()).resolves.toEqual({ items: [water], entries: [entry] });

    window.localStorage.setItem(COMFORT_ITEMS_STORAGE_KEY, "{ not json");
    window.localStorage.setItem(COMFORT_ENTRIES_STORAGE_KEY, JSON.stringify({ items: [water] }));
    await expect(repository.load()).resolves.toEqual({ items: [], entries: [] });
  });

  it("works without a storage backend", async () => {
    const repository = new LocalComfortRepository(null);

    await expect(repository.load()).resolves.toEqual({ items: [], entries: [] });
    await expect(repository.saveItems([water])).resolves.toBeUndefined();
    await expect(repository.saveEntries([entry])).resolves.toBeUndefined();
  });
});
