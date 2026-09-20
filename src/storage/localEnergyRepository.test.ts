import { beforeEach, describe, expect, it } from "vitest";

import type { EnergyRecord } from "../domain/energy";
import { ENERGY_STORAGE_KEY, LocalEnergyRepository } from "./localEnergyRepository";

const full: EnergyRecord = {
  id: "energy-1",
  dateKey: "2026-09-20",
  state: "full",
  changedAt: "2026-09-20T01:00:00.000Z",
};

const low: EnergyRecord = {
  id: "energy-2",
  dateKey: "2026-09-20",
  state: "low",
  changedAt: "2026-09-20T09:00:00.000Z",
  reason: "睡眠不足",
};

describe("LocalEnergyRepository", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts empty and round-trips energy records", async () => {
    const repository = new LocalEnergyRepository();

    await expect(repository.load()).resolves.toEqual({ records: [] });

    await repository.saveRecords([full, low]);

    await expect(repository.load()).resolves.toEqual({ records: [full, low] });
    expect(window.localStorage.getItem(ENERGY_STORAGE_KEY)).toContain("low");
  });

  it("filters invalid entries and falls back on corrupt data", async () => {
    const repository = new LocalEnergyRepository();

    window.localStorage.setItem(ENERGY_STORAGE_KEY, JSON.stringify([full, { id: "bad" }]));
    await expect(repository.load()).resolves.toEqual({ records: [full] });

    window.localStorage.setItem(ENERGY_STORAGE_KEY, "{ not json");
    await expect(repository.load()).resolves.toEqual({ records: [] });

    window.localStorage.setItem(ENERGY_STORAGE_KEY, JSON.stringify({ records: [full] }));
    await expect(repository.load()).resolves.toEqual({ records: [] });
  });

  it("works without a storage backend", async () => {
    const repository = new LocalEnergyRepository(null);

    await expect(repository.load()).resolves.toEqual({ records: [] });
    await expect(repository.saveRecords([full])).resolves.toBeUndefined();
  });
});
