import { getLocalDateKey } from "./calendar";
import { makeNextStep } from "./nextStep";
import { normalizeRepeatMode, type RepeatMode } from "./repeat";

export const statuses = ["未开始", "进行中", "完成", "暂时放下"] as const;

export type TaskStatus = (typeof statuses)[number];

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  nextStep: string;
  inToday: boolean;
  plannedDate: string | null;
  tagIds: string[];
  repeatMode: RepeatMode;
  timeSpentSeconds: number;
  createdAt: string;
  updatedAt: string;
};

export function normalizeTask(value: unknown): Task | null {
  if (!value || typeof value !== "object") return null;

  const task = value as Record<string, unknown>;
  const isValid =
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    typeof task.status === "string" &&
    statuses.includes(task.status as TaskStatus) &&
    typeof task.nextStep === "string" &&
    typeof task.inToday === "boolean" &&
    typeof task.createdAt === "string" &&
    typeof task.updatedAt === "string";

  if (!isValid) return null;

  const plannedDate =
    typeof task.plannedDate === "string"
      ? task.plannedDate
      : task.inToday === true
        ? getLocalDateKey()
        : null;

  const tagIds = Array.isArray(task.tagIds)
    ? Array.from(new Set(task.tagIds.filter((tagId): tagId is string => typeof tagId === "string")))
    : [];

  const timeSpentSeconds =
    typeof task.timeSpentSeconds === "number" &&
    Number.isFinite(task.timeSpentSeconds) &&
    task.timeSpentSeconds >= 0
      ? Math.floor(task.timeSpentSeconds)
      : 0;

  return {
    id: task.id as string,
    title: task.title as string,
    status: task.status as TaskStatus,
    nextStep: task.nextStep as string,
    inToday: task.inToday as boolean,
    plannedDate,
    tagIds,
    repeatMode: normalizeRepeatMode(task.repeatMode),
    timeSpentSeconds,
    createdAt: task.createdAt as string,
    updatedAt: task.updatedAt as string,
  };
}

export function isValidTask(value: unknown): value is Task {
  return normalizeTask(value) !== null;
}

export function getTodayTasks(items: readonly Task[]): Task[] {
  return items.filter((task) => task.inToday);
}

function createTaskId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createTask(title: string): Task {
  const now = new Date().toISOString();

  return {
    id: createTaskId(),
    title,
    status: "未开始",
    inToday: true,
    plannedDate: getLocalDateKey(),
    nextStep: makeNextStep(title),
    tagIds: [],
    repeatMode: "none",
    timeSpentSeconds: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateTask(task: Task, patch: Partial<Omit<Task, "id" | "createdAt">>): Task {
  return {
    ...task,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}

export function addTimeSpent(task: Task, seconds: number): Task {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return updateTask(task, {
    timeSpentSeconds: task.timeSpentSeconds + safeSeconds,
  });
}
