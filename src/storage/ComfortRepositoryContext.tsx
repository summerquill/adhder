import { createContext, useContext, type ReactNode } from "react";

import type { ComfortRepository } from "./ComfortRepository";

const ComfortRepositoryContext = createContext<ComfortRepository | null>(null);

type ComfortRepositoryProviderProps = {
  repository: ComfortRepository;
  children: ReactNode;
};

export function ComfortRepositoryProvider({
  repository,
  children,
}: ComfortRepositoryProviderProps) {
  return (
    <ComfortRepositoryContext.Provider value={repository}>
      {children}
    </ComfortRepositoryContext.Provider>
  );
}

export function useComfortRepository(): ComfortRepository {
  const repository = useContext(ComfortRepositoryContext);

  if (!repository) {
    throw new Error("useComfortRepository must be used inside ComfortRepositoryProvider");
  }

  return repository;
}
