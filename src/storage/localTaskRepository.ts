import { cloneSeedTasks, isValidTask, type Task } from "../domain/task";
import type { TaskRepository, TaskSnapshot } from "./TaskRepository";

export const TASK_STORAGE_KEY = "adhder.tasks.v1";
export const SELECTED_TASK_STORAGE_KEY = "adhder.selectedTaskId.v1";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getDefaultStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export class LocalTaskRepository implements TaskRepository {
  constructor(private readonly storage: StorageLike | null = getDefaultStorage()) {}

  async load(): Promise<TaskSnapshot> {
    const tasks = this.loadTasks();
    return {
      tasks,
      selectedTaskId: this.loadSelectedTaskId(tasks),
    };
  }

  async saveTasks(tasks: readonly Task[]): Promise<void> {
    if (!this.storage) return;
    this.storage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
  }

  async saveSelectedTaskId(selectedTaskId: string | null): Promise<void> {
    if (!this.storage) return;

    if (selectedTaskId) {
      this.storage.setItem(SELECTED_TASK_STORAGE_KEY, selectedTaskId);
      return;
    }

    this.storage.removeItem(SELECTED_TASK_STORAGE_KEY);
  }

  private loadTasks(): Task[] {
    if (!this.storage) return cloneSeedTasks();

    try {
      const saved = this.storage.getItem(TASK_STORAGE_KEY);
      if (!saved) return cloneSeedTasks();

      const parsed: unknown = JSON.parse(saved);
      if (!Array.isArray(parsed)) return cloneSeedTasks();

      const validTasks = parsed.filter(isValidTask);
      return validTasks.length ? validTasks : cloneSeedTasks();
    } catch {
      return cloneSeedTasks();
    }
  }

  private loadSelectedTaskId(tasks: readonly Task[]): string | null {
    if (!this.storage) return tasks[0]?.id ?? null;

    const savedId = this.storage.getItem(SELECTED_TASK_STORAGE_KEY);
    if (tasks.some((task) => task.id === savedId)) return savedId;

    return tasks[0]?.id ?? null;
  }
}

export const localTaskRepository = new LocalTaskRepository();
