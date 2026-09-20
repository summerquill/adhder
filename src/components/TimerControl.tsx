import { useEffect, useMemo, useRef, useState } from "react";

import type { Task, TaskStatus } from "../domain/task";
import { formatDuration, type TimerMode } from "../domain/timer";

const timerDurations = [5, 10, 15] as const;

type TimerControlProps = {
  task: Task | null;
  onStatusChange: (status: TaskStatus) => void;
  onTimeSpent: (taskId: string, seconds: number) => void;
};

export function TimerControl({ task, onStatusChange, onTimeSpent }: TimerControlProps) {
  const [mode, setMode] = useState<TimerMode>("countdown");
  const [selectedMinutes, setSelectedMinutes] = useState<number>(5);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const taskId = task?.id ?? null;
  const onTimeSpentRef = useRef(onTimeSpent);

  useEffect(() => {
    onTimeSpentRef.current = onTimeSpent;
  }, [onTimeSpent]);

  useEffect(() => {
    if (!running || !taskId) return;

    const timerId = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
      onTimeSpentRef.current(taskId, 1);
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [running, taskId]);

  useEffect(() => {
    if (mode === "countdown" && running && elapsedSeconds >= selectedMinutes * 60) {
      setRunning(false);
      setHasStarted(false);
    }
  }, [elapsedSeconds, mode, running, selectedMinutes]);

  const buttonLabel = useMemo(() => {
    if (running) return "暂停";
    if (hasStarted) return "继续";
    return "开始";
  }, [hasStarted, running]);

  const displaySeconds =
    mode === "countdown" ? Math.max(0, selectedMinutes * 60 - elapsedSeconds) : elapsedSeconds;

  function resetTimer() {
    setRunning(false);
    setHasStarted(false);
    setElapsedSeconds(0);
  }

  function changeMode(nextMode: TimerMode) {
    setMode(nextMode);
    resetTimer();
  }

  function changeDuration(minutes: number) {
    setSelectedMinutes(minutes);
    resetTimer();
  }

  function toggleTimer() {
    if (!task) return;

    if (!running && task.status === "未开始") {
      onStatusChange("进行中");
    }

    if (running) {
      setRunning(false);
      setHasStarted(true);
      return;
    }

    if (mode === "countdown" && elapsedSeconds >= selectedMinutes * 60) {
      setElapsedSeconds(0);
    }

    setRunning(true);
    setHasStarted(true);
  }

  return (
    <section className="timer-box" aria-labelledby="timerTitle">
      <h3 id="timerTitle">开始计时</h3>

      <div className="timer-mode-options" role="group" aria-label="选择计时模式">
        <button
          className={`timer-mode-option${mode === "countdown" ? " active" : ""}`}
          type="button"
          disabled={!task || running}
          onClick={() => changeMode("countdown")}
        >
          倒计时
        </button>
        <button
          className={`timer-mode-option${mode === "count-up" ? " active" : ""}`}
          type="button"
          disabled={!task || running}
          onClick={() => changeMode("count-up")}
        >
          正计时
        </button>
      </div>

      <div className="timer-display">{formatDuration(displaySeconds)}</div>

      {mode === "countdown" ? (
        <div className="timer-options" role="group" aria-label="选择计时时长">
          {timerDurations.map((minutes) => (
            <button
              key={minutes}
              className={`timer-option${selectedMinutes === minutes ? " active" : ""}`}
              type="button"
              data-minutes={minutes}
              disabled={!task || running}
              onClick={() => changeDuration(minutes)}
            >
              {minutes} 分钟
            </button>
          ))}
        </div>
      ) : null}

      <p className="task-time-total">
        累计执行时间：<strong>{formatDuration(task?.timeSpentSeconds ?? 0)}</strong>
      </p>

      <div className="timer-actions">
        <button type="button" disabled={!task} onClick={toggleTimer}>
          {buttonLabel}
        </button>
        <button className="secondary" type="button" disabled={!task} onClick={resetTimer}>
          重置
        </button>
      </div>
    </section>
  );
}
