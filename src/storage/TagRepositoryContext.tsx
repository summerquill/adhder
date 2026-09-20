import { createContext, useContext, type ReactNode } from "react";

import type { TagRepository } from "./TagRepository";

const TagRepositoryContext = createContext<TagRepository | null>(null);

type TagRepositoryProviderProps = {
  repository: TagRepository;
  children: ReactNode;
};

export function TagRepositoryProvider({ repository, children }: TagRepositoryProviderProps) {
  return <TagRepositoryContext.Provider value={repository}>{children}</TagRepositoryContext.Provider>;
}

export function useTagRepository(): TagRepository {
  const repository = useContext(TagRepositoryContext);

  if (!repository) {
    throw new Error("useTagRepository must be used inside TagRepositoryProvider");
  }

  return repository;
}
