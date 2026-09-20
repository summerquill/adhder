import type { Task } from "../domain/task";

export type TaskSnapshot = {
  tasks: Task[];
  selectedTaskId: string | null;
};

export interface TaskRepository {
  load(): Promise<TaskSnapshot>;
  saveTasks(tasks: readonly Task[]): Promise<void>;
  saveSelectedTaskId(selectedTaskId: string | null): Promise<void>;
}
