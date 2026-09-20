import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./app/App";
import { TagRepositoryProvider } from "./storage/TagRepositoryContext";
import { TaskRepositoryProvider } from "./storage/TaskRepositoryContext";
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
        <App />
      </TagRepositoryProvider>
    </TaskRepositoryProvider>
  </StrictMode>,
);
