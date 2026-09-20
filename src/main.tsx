import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./app/App";
import { ComfortRepositoryProvider } from "./storage/ComfortRepositoryContext";
import { EnergyRepositoryProvider } from "./storage/EnergyRepositoryContext";
import { TagRepositoryProvider } from "./storage/TagRepositoryContext";
import { TaskRepositoryProvider } from "./storage/TaskRepositoryContext";
import { localComfortRepository } from "./storage/localComfortRepository";
import { localEnergyRepository } from "./storage/localEnergyRepository";
import { localTagRepository } from "./storage/localTagRepository";
import { localTaskRepository } from "./storage/localTaskRepository";
import "./styles/globals.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Missing #root element");
}

createRoot(rootElement).render(
  <StrictMode>
    <TaskRepositoryProvider repository={localTaskRepository}>
      <TagRepositoryProvider repository={localTagRepository}>
        <EnergyRepositoryProvider repository={localEnergyRepository}>
          <ComfortRepositoryProvider repository={localComfortRepository}>
            <App />
          </ComfortRepositoryProvider>
        </EnergyRepositoryProvider>
      </TagRepositoryProvider>
    </TaskRepositoryProvider>
  </StrictMode>,
);
