import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeTask } from "../test/fixtures";
import { TimerControl } from "./TimerControl";

describe("TimerControl", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs the countdown timer and tracks execution time", () => {
    const onStatusChange = vi.fn();
    const onTimeSpent = vi.fn();
    const task = makeTask({ id: "timer-task", title: "开始整理", inToday: true });

    render(
      <TimerControl
        task={task}
        countdownPresets={[5, 10, 15]}
        onStatusChange={onStatusChange}
        onTimeSpent={onTimeSpent}
      />,
    );

    expect(screen.getByText("05:00")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "开始" }));
    expect(onStatusChange).toHaveBeenCalledWith("进行中");

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("04:59")).toBeInTheDocument();
    expect(onTimeSpent).toHaveBeenCalledWith(task.id, 1);

    fireEvent.click(screen.getByRole("button", { name: "暂停" }));
    expect(screen.getByRole("button", { name: "继续" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "重置" }));
    expect(screen.getByText("05:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始" })).toBeInTheDocument();
  });

  it("supports count-up mode without clearing accumulated task time", () => {
    const onStatusChange = vi.fn();
    const onTimeSpent = vi.fn();
    const task = makeTask({
      id: "timer-task",
      title: "开始整理",
      inToday: true,
      timeSpentSeconds: 12,
    });

    render(
      <TimerControl
        task={task}
        countdownPresets={[5, 10, 15]}
        onStatusChange={onStatusChange}
        onTimeSpent={onTimeSpent}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "正计时" }));
    expect(screen.getByText("00:00")).toBeInTheDocument();
    expect(screen.getByText("00:12")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "开始" }));

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText("00:02")).toBeInTheDocument();
    expect(onTimeSpent).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole("button", { name: "暂停" }));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onTimeSpent).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole("button", { name: "重置" }));
    expect(screen.getByText("00:00")).toBeInTheDocument();
    expect(screen.getByText("00:12")).toBeInTheDocument();
  });
});
