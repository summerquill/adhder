import { makeNextStep } from "./nextStep";

export const statuses = ["未开始", "进行中", "完成", "暂时放下"] as const;

export type TaskStatus = (typeof statuses)[number];

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  nextStep: string;
  inToday: boolean;
  createdAt: string;
  updatedAt: string;
};

export function isValidTask(value: unknown): value is Task {
  if (!value || typeof value !== "object") return false;

  const task = value as Record<string, unknown>;

  return (
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    typeof task.status === "string" &&
    statuses.includes(task.status as TaskStatus) &&
    typeof task.nextStep === "string" &&
    typeof task.inToday === "boolean" &&
    typeof task.createdAt === "string" &&
    typeof task.updatedAt === "string"
  );
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
    nextStep: makeNextStep(title),
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
