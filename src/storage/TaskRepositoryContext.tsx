import { createContext, useContext, type ReactNode } from "react";

import type { TaskRepository } from "./TaskRepository";

const TaskRepositoryContext = createContext<TaskRepository | null>(null);

type TaskRepositoryProviderProps = {
  repository: TaskRepository;
  children: ReactNode;
};

export function TaskRepositoryProvider({ repository, children }: TaskRepositoryProviderProps) {
  return <TaskRepositoryContext.Provider value={repository}>{children}</TaskRepositoryContext.Provider>;
}

export function useTaskRepository(): TaskRepository {
  const repository = useContext(TaskRepositoryContext);

  if (!repository) {
    throw new Error("useTaskRepository must be used inside TaskRepositoryProvider");
  }

  return repository;
}
