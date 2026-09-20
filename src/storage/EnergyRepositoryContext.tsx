import { createContext, useContext, type ReactNode } from "react";

import type { EnergyRepository } from "./EnergyRepository";

const EnergyRepositoryContext = createContext<EnergyRepository | null>(null);

type EnergyRepositoryProviderProps = {
  repository: EnergyRepository;
  children: ReactNode;
};

export function EnergyRepositoryProvider({
  repository,
  children,
}: EnergyRepositoryProviderProps) {
  return (
    <EnergyRepositoryContext.Provider value={repository}>
      {children}
    </EnergyRepositoryContext.Provider>
  );
}

export function useEnergyRepository(): EnergyRepository {
  const repository = useContext(EnergyRepositoryContext);

  if (!repository) {
    throw new Error("useEnergyRepository must be used inside EnergyRepositoryProvider");
  }

  return repository;
}
