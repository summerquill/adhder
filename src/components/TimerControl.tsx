import { useEffect, useMemo, useState } from "react";

import type { Task, TaskStatus } from "../domain/task";

const timerDurations = [5, 10, 15] as const;

type TimerControlProps = {
  task: Task | null;
  onStatusChange: (status: TaskStatus) => void;
};

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

export function TimerControl({ task, onStatusChange }: TimerControlProps) {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(5);
  const [remainingSeconds, setRemainingSeconds] = useState(selectedMinutes * 60);
  const [running, setRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!running) return;

    const timerId = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [running]);

  useEffect(() => {
    if (remainingSeconds === 0 && running) {
      setRunning(false);
      setHasStarted(false);
    }
  }, [remainingSeconds, running]);

  const buttonLabel = useMemo(() => {
    if (running) return "暂停";
    if (remainingSeconds === 0 || hasStarted) return "继续";
    return "开始";
  }, [hasStarted, remainingSeconds, running]);

  function resetTimer(minutes = selectedMinutes) {
    setRunning(false);
    setHasStarted(false);
    setSelectedMinutes(minutes);
    setRemainingSeconds(minutes * 60);
  }

  function toggleTimer() {
    if (!running && task?.status === "未开始") {
      onStatusChange("进行中");
    }

    if (running) {
      setRunning(false);
      setHasStarted(true);
      return;
    }

    if (remainingSeconds === 0) {
      setRemainingSeconds(selectedMinutes * 60);
    }

    setRunning(true);
    setHasStarted(true);
  }

  return (
    <section className="timer-box" aria-labelledby="timerTitle">
      <h3 id="timerTitle">开始计时</h3>
      <div className="timer-display">{formatTime(remainingSeconds)}</div>
      <div className="timer-options" role="group" aria-label="选择计时时长">
        {timerDurations.map((minutes) => (
          <button
            key={minutes}
            className={`timer-option${selectedMinutes === minutes ? " active" : ""}`}
            type="button"
            data-minutes={minutes}
            disabled={running}
            onClick={() => resetTimer(minutes)}
          >
            {minutes} 分钟
          </button>
        ))}
      </div>
      <div className="timer-actions">
        <button type="button" onClick={toggleTimer}>
          {buttonLabel}
        </button>
        <button className="secondary" type="button" onClick={() => resetTimer()}>
          重置
        </button>
      </div>
    </section>
  );
}
