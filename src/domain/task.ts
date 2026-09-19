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

export const seedTasks: Task[] = [
  {
    id: "seed-1",
    title: "整理房间",
    status: "进行中",
    inToday: true,
    nextStep: "把地上的衣服放进洗衣篮",
    createdAt: "2026-09-19T00:00:00.000Z",
    updatedAt: "2026-09-19T00:00:00.000Z",
  },
  {
    id: "seed-2",
    title: "回复体检预约消息",
    status: "未开始",
    inToday: true,
    nextStep: "打开聊天窗口，先确认对方发来的可选时间",
    createdAt: "2026-09-19T00:01:00.000Z",
    updatedAt: "2026-09-19T00:01:00.000Z",
  },
  {
    id: "seed-3",
    title: "买洗衣液",
    status: "未开始",
    inToday: false,
    nextStep: "打开购物 App，搜索常买的洗衣液",
    createdAt: "2026-09-19T00:02:00.000Z",
    updatedAt: "2026-09-19T00:02:00.000Z",
  },
  {
    id: "seed-4",
    title: "整理下周要交的材料",
    status: "暂时放下",
    inToday: false,
    nextStep: "新建一个文件夹，把已有材料先拖进去",
    createdAt: "2026-09-19T00:03:00.000Z",
    updatedAt: "2026-09-19T00:03:00.000Z",
  },
];

export function cloneSeedTasks(): Task[] {
  return seedTasks.map((task) => ({ ...task }));
}

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

export function canAddToToday(items: readonly Task[]): boolean {
  return getTodayTasks(items).length < 3;
}

function createTaskId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createTask(title: string, existingTasks: readonly Task[]): Task {
  const now = new Date().toISOString();

  return {
    id: createTaskId(),
    title,
    status: "未开始",
    inToday: canAddToToday(existingTasks),
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
