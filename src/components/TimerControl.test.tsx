import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Task } from "../domain/task";
import { TimerControl } from "./TimerControl";

const task: Task = {
  id: "timer-task",
  title: "开始整理",
  status: "未开始",
  nextStep: "收好一件衣服",
  inToday: true,
  createdAt: "2026-09-19T00:00:00.000Z",
  updatedAt: "2026-09-19T00:00:00.000Z",
};

describe("TimerControl", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts, pauses, counts down and resets", () => {
    const onStatusChange = vi.fn();
    render(<TimerControl task={task} onStatusChange={onStatusChange} />);

    expect(screen.getByText("05:00")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "开始" }));
    expect(onStatusChange).toHaveBeenCalledWith("进行中");
    expect(screen.getByRole("button", { name: "暂停" })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("04:59")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "暂停" }));
    expect(screen.getByRole("button", { name: "继续" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "重置" }));
    expect(screen.getByText("05:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始" })).toBeInTheDocument();
  });
});
