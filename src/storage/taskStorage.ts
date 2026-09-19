import { cloneSeedTasks, isValidTask, type Task } from "../domain/task";

export const TASK_STORAGE_KEY = "adhder.tasks.v1";
export const SELECTED_TASK_STORAGE_KEY = "adhder.selectedTaskId.v1";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getDefaultStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function loadTasks(storage: StorageLike | null = getDefaultStorage()): Task[] {
  if (!storage) return cloneSeedTasks();

  try {
    const saved = storage.getItem(TASK_STORAGE_KEY);
    if (!saved) return cloneSeedTasks();

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return cloneSeedTasks();

    const validTasks = parsed.filter(isValidTask);
    return validTasks.length ? validTasks : cloneSeedTasks();
  } catch {
    return cloneSeedTasks();
  }
}

export function saveTasks(tasks: readonly Task[], storage: StorageLike | null = getDefaultStorage()): void {
  if (!storage) return;
  storage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
}

export function loadSelectedTaskId(
  tasks: readonly Task[],
  storage: StorageLike | null = getDefaultStorage(),
): string | null {
  if (!storage) return tasks[0]?.id ?? null;

  const savedId = storage.getItem(SELECTED_TASK_STORAGE_KEY);
  if (tasks.some((task) => task.id === savedId)) return savedId;

  return tasks[0]?.id ?? null;
}

export function saveSelectedTaskId(
  selectedTaskId: string | null,
  storage: StorageLike | null = getDefaultStorage(),
): void {
  if (!storage) return;

  if (selectedTaskId) {
    storage.setItem(SELECTED_TASK_STORAGE_KEY, selectedTaskId);
    return;
  }

  storage.removeItem(SELECTED_TASK_STORAGE_KEY);
}
