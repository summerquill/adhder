import { getLocalDateKey, isDateKey } from "./calendar";

export const energyStates = ["full", "holding", "low"] as const;

export type EnergyState = (typeof energyStates)[number];

export const energyStateLabels: Record<EnergyState, string> = {
  full: "满血",
  holding: "还不错",
  low: "低电量",
};

export type EnergyRecord = {
  id: string;
  dateKey: string;
  state: EnergyState;
  changedAt: string;
  reason?: string;
  note?: string;
};

function createEnergyRecordId(): string {
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

export function isEnergyState(value: unknown): value is EnergyState {
  return typeof value === "string" && energyStates.includes(value as EnergyState);
}

export function normalizeEnergyRecord(value: unknown): EnergyRecord | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const isValid =
    typeof record.id === "string" &&
    record.id.length > 0 &&
    isDateKey(record.dateKey) &&
    isEnergyState(record.state) &&
    typeof record.changedAt === "string" &&
    record.changedAt.length > 0;

  if (!isValid) return null;

  const normalized: EnergyRecord = {
    id: record.id as string,
    dateKey: record.dateKey as string,
    state: record.state as EnergyState,
    changedAt: record.changedAt as string,
  };

  const reason = normalizeOptionalText(record.reason);
  const note = normalizeOptionalText(record.note);

  if (reason) normalized.reason = reason;
  if (note) normalized.note = note;

  return normalized;
}

export function normalizeEnergyRecords(value: unknown): EnergyRecord[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(normalizeEnergyRecord)
    .filter((record): record is EnergyRecord => record !== null);
}

export type CreateEnergyRecordOptions = {
  dateKey?: string;
  changedAt?: string;
  reason?: string;
  note?: string;
};

export function createEnergyRecord(
  state: EnergyState,
  options: CreateEnergyRecordOptions = {},
): EnergyRecord {
  const record: EnergyRecord = {
    id: createEnergyRecordId(),
    dateKey: options.dateKey ?? getLocalDateKey(),
    state,
    changedAt: options.changedAt ?? new Date().toISOString(),
  };

  const reason = normalizeOptionalText(options.reason);
  const note = normalizeOptionalText(options.note);

  if (reason) record.reason = reason;
  if (note) record.note = note;

  return record;
}

function compareEnergyRecords(left: EnergyRecord, right: EnergyRecord): number {
  return left.changedAt.localeCompare(right.changedAt);
}

export function getEnergyRecordsForDate(
  records: readonly EnergyRecord[],
  dateKey: string,
): EnergyRecord[] {
  return records.filter((record) => record.dateKey === dateKey).sort(compareEnergyRecords);
}

export function getLatestEnergyRecord(
  records: readonly EnergyRecord[],
  dateKey: string,
): EnergyRecord | null {
  const dailyRecords = getEnergyRecordsForDate(records, dateKey);
  return dailyRecords.length > 0 ? dailyRecords[dailyRecords.length - 1] : null;
}

export function getEnergyStateForDate(
  records: readonly EnergyRecord[],
  dateKey: string,
): EnergyState | null {
  return getLatestEnergyRecord(records, dateKey)?.state ?? null;
}
