import type { EnergyRecord } from "../domain/energy";

export type EnergySnapshot = {
  records: EnergyRecord[];
};

export interface EnergyRepository {
  load(): Promise<EnergySnapshot>;
  saveRecords(records: readonly EnergyRecord[]): Promise<void>;
}
