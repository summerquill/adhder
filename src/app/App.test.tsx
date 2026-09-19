import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { TASK_STORAGE_KEY } from "../storage/taskStorage";
import App from "./App";

function storedTasks() {
  return JSON.parse(window.localStorage.getItem(TASK_STORAGE_KEY) ?? "[]") as Array<{
    title: string;
    status: string;
    nextStep: string;
  }>;
}

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("collects a task and keeps it after the app is rendered again", async () => {
    const user = userEvent.setup();
    const firstRender = render(<App />);

    await user.type(screen.getByLabelText("先把脑子里的事放下来"), "喝水");
    await user.click(screen.getByRole("button", { name: "收集" }));

    expect(screen.getAllByText("喝水").length).toBeGreaterThan(0);
    await waitFor(() => expect(storedTasks()[0]?.title).toBe("喝水"));

    firstRender.unmount();
    render(<App />);
    expect(screen.getAllByText("喝水").length).toBeGreaterThan(0);
  });

  it("accepts a generated next-step suggestion", async () => {
    const user = userEvent.setup();
    render(<App />);

    const nextStepInput = screen.getByLabelText("下一步动作");
    const suggestion = screen.getByTestId("suggestion-text").textContent;

    expect(nextStepInput).toHaveValue("把地上的衣服放进洗衣篮");
    await user.click(screen.getByRole("button", { name: "接受建议" }));

    expect(nextStepInput).toHaveValue(suggestion);
    await waitFor(() => expect(storedTasks()[0]?.nextStep).toBe(suggestion));
  });

  it("records a task status immediately", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "完成" }));

    expect(screen.getByText("当前状态：完成")).toBeInTheDocument();
    await waitFor(() => expect(storedTasks()[0]?.status).toBe("完成"));
  });
});
