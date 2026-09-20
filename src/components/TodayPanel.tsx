import { useState } from "react";

import { formatDateLabel, getLocalDateKey } from "../domain/calendar";
import type { ComfortEntry, ComfortItem } from "../domain/comfort";
import type { EnergyState } from "../domain/energy";
import type { Tag } from "../domain/tag";
import { getTodayTasks, type Task } from "../domain/task";
import { ComfortCard } from "./ComfortCard";
import { DayPlanModal } from "./DayPlanModal";
import { EnergySelector } from "./EnergySelector";
import { TaskCard } from "./TaskCard";

export type ComfortEntryPair = {
  entry: ComfortEntry;
  item: ComfortItem;
};

type TodayPanelProps = {
  tasks: readonly Task[];
  tags: readonly Tag[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onRemoveTaskFromToday: (taskId: string) => void;
  tagsEnabled: boolean;
  onOpenRepeatSettings: (taskId: string) => void;
  onOpenTagSettings: (taskId: string) => void;
  energyEnabled: boolean;
  energyState: EnergyState | null;
  onEnergyChange: (state: EnergyState) => void;
  onOpenCare: () => void;
  comfortEntries: readonly ComfortEntryPair[];
  onComfortNoteChange: (entryId: string, note: string) => void;
  onCompleteComfort: (entryId: string) => void;
};

export function TodayPanel({
  tasks,
  tags,
  selectedTaskId,
  onSelectTask,
  onRemoveTaskFromToday,
  tagsEnabled,
  onOpenRepeatSettings,
  onOpenTagSettings,
  energyEnabled,
  energyState,
  onEnergyChange,
  onOpenCare,
  comfortEntries,
  onComfortNoteChange,
  onCompleteComfort,
}: TodayPanelProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const todayTasks = getTodayTasks(tasks);
  const todayKey = getLocalDateKey();

  return (
    <section className="panel today-panel" aria-labelledby="todayTitle">
      <div className="section-head">
        <div>
          <p className="eyebrow">Step 2</p>
          <h2 id="todayTitle">今日 3 件事</h2>
        </div>
        <p className="hint">建议先挑 1～3 件今天推进，也可以继续添加。</p>
      </div>

      {energyEnabled ? (
        <EnergySelector state={energyState} onChange={onEnergyChange} onOpenCare={onOpenCare} />
      ) : null}

      <div className="calendar-toolbar">
        <button className="secondary" type="button" onClick={() => setCalendarOpen(true)}>
          日历
        </button>
        <span>{formatDateLabel(todayKey)}</span>
      </div>

      <div className="today-list" aria-live="polite">
        {todayTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            tags={tags}
            isSelected={task.id === selectedTaskId}
            onSelect={() => onSelectTask(task.id)}
            moveLabel="移出今日"
            onMove={() => onRemoveTaskFromToday(task.id)}
            tagsEnabled={tagsEnabled}
            onOpenRepeatSettings={() => onOpenRepeatSettings(task.id)}
            onOpenTagSettings={() => onOpenTagSettings(task.id)}
          />
        ))}

        {todayTasks.length === 0 && comfortEntries.length === 0 ? (
          <div className="empty-state">从 Inbox 里选一件今天想推进的事。</div>
        ) : null}

        {comfortEntries.length > 0 ? (
          <>
            <p className="comfort-list-title">照顾自己</p>
            {comfortEntries.map(({ entry, item }) => (
              <ComfortCard
                key={entry.id}
                title={item.title}
                note={entry.note ?? ""}
                completed={entry.completedAt !== null}
                onNoteChange={(note) => onComfortNoteChange(entry.id, note)}
                onComplete={() => onCompleteComfort(entry.id)}
              />
            ))}
          </>
        ) : null}
      </div>

      {calendarOpen ? (
        <DayPlanModal
          tasks={tasks}
          initialDate={todayKey}
          onClose={() => setCalendarOpen(false)}
        />
      ) : null}
    </section>
  );
}
