import { normalizeEnergyRecords, type EnergyRecord } from "../domain/energy";
import type { EnergyRepository, EnergySnapshot } from "./EnergyRepository";

export const ENERGY_STORAGE_KEY = "adhder.energy.v1";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getDefaultStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export class LocalEnergyRepository implements EnergyRepository {
  constructor(private readonly storage: StorageLike | null = getDefaultStorage()) {}

  async load(): Promise<EnergySnapshot> {
    return {
      records: this.loadRecords(),
    };
  }

  async saveRecords(records: readonly EnergyRecord[]): Promise<void> {
    if (!this.storage) return;
    this.storage.setItem(ENERGY_STORAGE_KEY, JSON.stringify(records));
  }

  private loadRecords(): EnergyRecord[] {
    if (!this.storage) return [];

    try {
      const saved = this.storage.getItem(ENERGY_STORAGE_KEY);
      if (!saved) return [];

      return normalizeEnergyRecords(JSON.parse(saved));
    } catch {
      return [];
    }
  }
}

export const localEnergyRepository = new LocalEnergyRepository();
