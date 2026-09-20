import { useState } from "react";

import {
  addMonths,
  buildMonthGrid,
  formatDateLabel,
  getLocalDateKey,
  parseDateKey,
} from "../domain/calendar";
import { getRepeatModeLabel } from "../domain/repeat";
import { isTaskScheduledForDate, taskStatusClassNames, type Task } from "../domain/task";

type DayPlanModalProps = {
  tasks: readonly Task[];
  initialDate: string;
  onClose: () => void;
};

const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

export function DayPlanModal({ tasks, initialDate, onClose }: DayPlanModalProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const initialMonth = parseDateKey(initialDate);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1),
  );

  const calendarDays = buildMonthGrid(visibleMonth);
  const selectedTasks = tasks.filter((task) => isTaskScheduledForDate(task, selectedDate));
  const todayKey = getLocalDateKey();

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="task-modal calendar-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dayPlanTitle"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mini-head">
          <div>
            <p className="eyebrow">今日 3 件事</p>
            <h3 id="dayPlanTitle">{formatDateLabel(selectedDate)}</h3>
          </div>
          <button className="secondary" type="button" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="calendar-month-head">
          <button
            className="secondary calendar-nav"
            type="button"
            aria-label="上一个月"
            onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
          >
            ‹
          </button>
          <strong>
            {visibleMonth.getFullYear()} 年 {visibleMonth.getMonth() + 1} 月
          </strong>
          <button
            className="secondary calendar-nav"
            type="button"
            aria-label="下一个月"
            onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
          >
            ›
          </button>
        </div>

        <div className="calendar-weekdays" aria-hidden="true">
          {weekdays.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>

        <div className="calendar-grid">
          {calendarDays.map((day) => {
            const taskCount = tasks.filter((task) => isTaskScheduledForDate(task, day.dateKey)).length;
            const className = [
              "calendar-day",
              day.inCurrentMonth ? "" : "outside-month",
              day.dateKey === todayKey ? "today" : "",
              day.dateKey === selectedDate ? "selected" : "",
              taskCount > 0 ? "has-tasks" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                key={day.dateKey}
                className={className}
                type="button"
                aria-label={`${day.dateKey}，${taskCount} 个任务`}
                onClick={() => setSelectedDate(day.dateKey)}
              >
                <span>{day.day}</span>
                {taskCount > 0 ? <small>{taskCount}</small> : null}
              </button>
            );
          })}
        </div>

        <div className="day-plan-list">
          {selectedTasks.length === 0 ? (
            <div className="empty-state">这一天没有安排任务。</div>
          ) : (
            selectedTasks.map((task) => (
              <article className="day-plan-item" key={task.id}>
                <div>
                  <strong>{task.title}</strong>
                  <span>{task.nextStep}</span>
                </div>
                <span className={`badge ${taskStatusClassNames[task.status]}`}>{task.status}</span>
                {task.repeatMode !== "none" ? (
                  <span className="repeat-badge">{getRepeatModeLabel(task.repeatMode)}</span>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
