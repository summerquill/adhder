import { useEffect, useState } from "react";

import { playCelebration } from "../audio/celebration";
import { CarePanel } from "../components/CarePanel";
import { InboxPanel } from "../components/InboxPanel";
import { RepeatModeModal } from "../components/RepeatModeModal";
import { SettingsPage } from "../components/SettingsPage";
import { TaskDetailPanel } from "../components/TaskDetailPanel";
import { TagSelectionModal } from "../components/TagSelectionModal";
import { TodayPanel, type ComfortEntryPair } from "../components/TodayPanel";
import { getLocalDateKey } from "../domain/calendar";
import {
  completeComfortEntry,
  createComfortEntry,
  createComfortItem,
  getComfortEntriesForDate,
  getRecentComfortItemIds,
  updateComfortEntry,
  type ComfortEffort,
  type ComfortEntry,
  type ComfortItem,
} from "../domain/comfort";
import { LocalComfortSuggestionProvider } from "../domain/comfortSuggestion";
import {
  createEnergyRecord,
  getEnergyStateForDate,
  type EnergyRecord,
  type EnergyState,
} from "../domain/energy";
import { makeAlternateNextStep } from "../domain/nextStep";
import type { RepeatMode } from "../domain/repeat";
import {
  createTag,
  defaultUserSettings,
  getDescendantTagIds,
  type Tag,
  type UserSettings,
} from "../domain/tag";
import {
  addTimeSpent,
  createTask,
  getTodayTasks,
  updateTask,
  type Task,
  type TaskStatus,
} from "../domain/task";
import { useComfortRepository } from "../storage/ComfortRepositoryContext";
import { useEnergyRepository } from "../storage/EnergyRepositoryContext";
import { useTagRepository } from "../storage/TagRepositoryContext";
import { useTaskRepository } from "../storage/TaskRepositoryContext";

type ActiveTab = "inbox" | "today" | "settings";

const comfortSuggestionProvider = new LocalComfortSuggestionProvider();
type TaskModal = { type: "repeat" | "tags"; taskId: string } | null;

const tabDefinitions: Array<{ id: ActiveTab; label: string; index: string }> = [
  { id: "inbox", label: "快速 Inbox", index: "01" },
  { id: "today", label: "今日 3 件事", index: "02" },
  { id: "settings", label: "设置", index: "03" },
];

const tabTitles: Record<ActiveTab, string> = {
  inbox: "快速 Inbox",
  today: "今日 3 件事",
  settings: "个性化设置",
};

export default function App() {
  const taskRepository = useTaskRepository();
  const tagRepository = useTagRepository();
  const energyRepository = useEnergyRepository();
  const comfortRepository = useComfortRepository();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [energyRecords, setEnergyRecords] = useState<EnergyRecord[]>([]);
  const [comfortItems, setComfortItems] = useState<ComfortItem[]>([]);
  const [comfortEntries, setComfortEntries] = useState<ComfortEntry[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [pendingSuggestion, setPendingSuggestion] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("inbox");
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [isCarePageOpen, setIsCarePageOpen] = useState(false);
  const [taskModal, setTaskModal] = useState<TaskModal>(null);
  const [isReady, setIsReady] = useState(false);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null;
  const modalTask = taskModal ? tasks.find((task) => task.id === taskModal.taskId) ?? null : null;
  const todayKey = getLocalDateKey();
  const todayTaskCount = getTodayTasks(tasks, todayKey).length;
  const todayEnergyState = getEnergyStateForDate(energyRecords, todayKey);
  const todayComfortEntries = getComfortEntriesForDate(comfortEntries, todayKey)
    .map((entry) => ({
      entry,
      item: comfortItems.find((item) => item.id === entry.itemId),
    }))
    .filter((pair): pair is ComfortEntryPair => Boolean(pair.item));
  const isSubPageOpen = isTaskDetailOpen || isCarePageOpen;

  useEffect(() => {
    let isActive = true;

    void Promise.all([
      taskRepository.load(),
      tagRepository.load(),
      energyRepository.load(),
      comfortRepository.load(),
    ]).then(([taskSnapshot, tagSnapshot, energySnapshot, comfortSnapshot]) => {
      if (!isActive) return;

      const currentDateKey = getLocalDateKey();
      const validTagIds = new Set(tagSnapshot.tags.map((tag) => tag.id));
      const migratedTasks = taskSnapshot.tasks.map((task) => {
        const migratedTask = {
          ...task,
          tagIds: task.tagIds.filter((tagId) => validTagIds.has(tagId)),
        };

        if (migratedTask.inToday && migratedTask.plannedDate !== currentDateKey) {
          return updateTask(migratedTask, { inToday: false });
        }

        return migratedTask;
      });
      const initialSelectedTask =
        migratedTasks.find((task) => task.id === taskSnapshot.selectedTaskId) ??
        migratedTasks[0] ??
        null;

      setTasks(migratedTasks);
      setSelectedTaskId(taskSnapshot.selectedTaskId);
      setPendingSuggestion(
        initialSelectedTask
          ? makeAlternateNextStep(initialSelectedTask.title, initialSelectedTask.nextStep)
          : "",
      );
      setTags(tagSnapshot.tags);
      setEnergyRecords(energySnapshot.records);
      setComfortItems(comfortSnapshot.items);
      setComfortEntries(comfortSnapshot.entries);
      setSettings(tagSnapshot.settings);
      setIsReady(true);
    });

    return () => {
      isActive = false;
    };
  }, [comfortRepository, energyRepository, tagRepository, taskRepository]);

  useEffect(() => {
    if (!isReady) return;
    void taskRepository.saveTasks(tasks);
  }, [isReady, taskRepository, tasks]);

  useEffect(() => {
    if (!isReady) return;
    void taskRepository.saveSelectedTaskId(selectedTaskId);
  }, [isReady, selectedTaskId, taskRepository]);

  useEffect(() => {
    if (!isReady) return;
    void tagRepository.saveTags(tags);
  }, [isReady, tagRepository, tags]);

  useEffect(() => {
    if (!isReady) return;
    void tagRepository.saveSettings(settings);
  }, [isReady, settings, tagRepository]);

  useEffect(() => {
    if (!isReady) return;
    void energyRepository.saveRecords(energyRecords);
  }, [energyRecords, energyRepository, isReady]);

  useEffect(() => {
    if (!isReady) return;
    void comfortRepository.saveItems(comfortItems);
  }, [comfortItems, comfortRepository, isReady]);

  useEffect(() => {
    if (!isReady) return;
    void comfortRepository.saveEntries(comfortEntries);
  }, [comfortEntries, comfortRepository, isReady]);

  function patchTask(taskId: string, patch: Partial<Omit<Task, "id" | "createdAt">>) {
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? updateTask(task, patch) : task)),
    );
  }

  function selectTask(taskId: string) {
    const task = tasks.find((item) => item.id === taskId);
    setSelectedTaskId(taskId);
    setPendingSuggestion(task ? makeAlternateNextStep(task.title, task.nextStep) : "");
  }

  function openTask(taskId: string) {
    selectTask(taskId);
    setIsCarePageOpen(false);
    setIsTaskDetailOpen(true);
  }

  function openCarePage() {
    setIsTaskDetailOpen(false);
    setIsCarePageOpen(true);
  }

  function selectTab(tab: ActiveTab) {
    setActiveTab(tab);
    setIsTaskDetailOpen(false);
    setIsCarePageOpen(false);
    setTaskModal(null);
  }

  function handleCreateTask(title: string) {
    const task = createTask(title);
    setTasks((currentTasks) => [task, ...currentTasks]);
    setSelectedTaskId(task.id);
    setPendingSuggestion(makeAlternateNextStep(task.title, task.nextStep));
  }

  function handleAddTaskToToday(taskId: string) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    patchTask(task.id, { inToday: true, plannedDate: getLocalDateKey() });
    selectTask(task.id);
  }

  function handleEditNextStep(nextStep: string) {
    if (!selectedTask) return;

    patchTask(selectedTask.id, { nextStep });
    setPendingSuggestion(makeAlternateNextStep(selectedTask.title, nextStep));
  }

  function handleRegenerateStep() {
    if (!selectedTask) return;

    setPendingSuggestion(
      makeAlternateNextStep(selectedTask.title, pendingSuggestion || selectedTask.nextStep),
    );
  }

  function handleAcceptStep() {
    if (!selectedTask || !pendingSuggestion) return;

    patchTask(selectedTask.id, { nextStep: pendingSuggestion });
    setPendingSuggestion(makeAlternateNextStep(selectedTask.title, pendingSuggestion));
  }

  function handleStatusChange(status: TaskStatus) {
    if (!selectedTask) return;

    const isNewCompletion = status === "完成" && selectedTask.status !== "完成";
    patchTask(selectedTask.id, { status });

    if (isNewCompletion) {
      if (settings.celebrationSoundEnabled) {
        playCelebration();
      }

      // 完成一件任务后直接回到今日列表，让用户马上看到进度。
      setIsTaskDetailOpen(false);
      setIsCarePageOpen(false);
      setActiveTab("today");
    }
  }

  function handleTimeSpent(taskId: string, seconds: number) {
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? addTimeSpent(task, seconds) : task)),
    );
  }

  function handleCreateTag(name: string, parentId: string | null) {
    const tag = createTag(name, parentId, tags);
    setTags((currentTags) => [...currentTags, tag]);
  }

  function handleDeleteTag(tagId: string) {
    const deletedTagIds = getDescendantTagIds(tagId, tags);
    setTags((currentTags) => currentTags.filter((tag) => !deletedTagIds.has(tag.id)));
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.tagIds.some((assignedTagId) => deletedTagIds.has(assignedTagId))
          ? updateTask(task, {
              tagIds: task.tagIds.filter((assignedTagId) => !deletedTagIds.has(assignedTagId)),
            })
          : task,
      ),
    );
  }

  function handleAddTagToTask(tagId: string) {
    if (!selectedTask) return;
    patchTask(selectedTask.id, {
      tagIds: Array.from(new Set([...selectedTask.tagIds, tagId])),
    });
  }

  function handleRemoveTagFromTask(tagId: string) {
    if (!selectedTask) return;
    patchTask(selectedTask.id, {
      tagIds: selectedTask.tagIds.filter((assignedTagId) => assignedTagId !== tagId),
    });
  }

  function handleToggleTagForTask(taskId: string, tagId: string) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    patchTask(taskId, {
      tagIds: task.tagIds.includes(tagId)
        ? task.tagIds.filter((assignedTagId) => assignedTagId !== tagId)
        : [...task.tagIds, tagId],
    });
  }

  function handleSaveRepeatMode(taskId: string, repeatMode: RepeatMode) {
    patchTask(taskId, { repeatMode });
  }

  function handleEnergyChange(state: EnergyState) {
    setEnergyRecords((currentRecords) => [
      ...currentRecords,
      createEnergyRecord(state, { dateKey: getLocalDateKey() }),
    ]);
  }

  function handleCreateComfortItem(title: string, effort: ComfortEffort, howTo?: string) {
    setComfortItems((currentItems) => [
      ...currentItems,
      createComfortItem(title, { effort, howTo }),
    ]);
  }

  function handleDeleteComfortItem(itemId: string) {
    setComfortItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
    setComfortEntries((currentEntries) =>
      currentEntries.filter((entry) => entry.itemId !== itemId),
    );
  }

  function handleAdoptComfortItem(itemId: string) {
    const dateKey = getLocalDateKey();
    const alreadyAdoptedToday = comfortEntries.some(
      (entry) => entry.itemId === itemId && entry.dateKey === dateKey,
    );

    if (!alreadyAdoptedToday) {
      setComfortEntries((currentEntries) => [
        ...currentEntries,
        createComfortEntry(itemId, { dateKey }),
      ]);
    }

    setIsCarePageOpen(false);
  }

  function handleComfortNoteChange(entryId: string, note: string) {
    setComfortEntries((currentEntries) =>
      currentEntries.map((entry) =>
        entry.id === entryId ? updateComfortEntry(entry, { note }) : entry,
      ),
    );
  }

  function handleCompleteComfortEntry(entryId: string) {
    const entry = comfortEntries.find((item) => item.id === entryId);
    if (!entry || entry.completedAt) return;

    setComfortEntries((currentEntries) =>
      currentEntries.map((item) =>
        item.id === entryId ? completeComfortEntry(item) : item,
      ),
    );
    if (settings.celebrationSoundEnabled) {
      playCelebration();
    }
  }

  if (!isReady) {
    return (
      <main className="app-shell" aria-busy="true">
        <div className="empty-state">正在加载任务...</div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className={`app-header${isSubPageOpen ? " detail-header" : ""}`}>
        {isSubPageOpen ? (
          <button
            className="secondary back-button"
            type="button"
            aria-label={isCarePageOpen ? "返回今日 3 件事" : "返回任务列表"}
            onClick={() => {
              setIsCarePageOpen(false);
              setIsTaskDetailOpen(false);
            }}
          >
            ←
          </button>
        ) : null}
        <div className="header-title">
          <p className="eyebrow">ADHDer</p>
          <h1>
            {isCarePageOpen ? "照顾自己" : isTaskDetailOpen ? "开始一个小动作" : tabTitles[activeTab]}
          </h1>
        </div>
        <div className="today-meter" aria-label="今日重点数量">
          <span>{todayTaskCount}</span>
          <small>件今日重点</small>
        </div>
      </header>

      <section className="app-content">
        {isTaskDetailOpen ? (
          <div className="tab-panel task-detail-panel" role="region" aria-label="开始一个小动作">
            <TaskDetailPanel
              task={selectedTask}
              tags={tags}
              tagsEnabled={settings.tagsEnabled}
              nextStepEnabled={settings.nextStepEnabled}
              countdownPresets={settings.countdownPresets}
              pendingSuggestion={pendingSuggestion}
              onEditNextStep={handleEditNextStep}
              onRegenerateStep={handleRegenerateStep}
              onAcceptStep={handleAcceptStep}
              onStatusChange={handleStatusChange}
              onTimeSpent={handleTimeSpent}
              onAddTag={handleAddTagToTask}
              onRemoveTag={handleRemoveTagFromTask}
            />
          </div>
        ) : null}

        {isCarePageOpen ? (
          <div className="tab-panel care-panel" role="region" aria-label="照顾自己">
            <CarePanel
              items={comfortItems}
              energyState={todayEnergyState}
              recentItemIds={getRecentComfortItemIds(comfortEntries, 3)}
              suggestionProvider={comfortSuggestionProvider}
              onAdopt={handleAdoptComfortItem}
              onCreateItem={handleCreateComfortItem}
              onDeleteItem={handleDeleteComfortItem}
            />
          </div>
        ) : null}

        {!isSubPageOpen && activeTab === "inbox" ? (
          <div className="tab-panel" role="tabpanel" aria-label="快速 Inbox">
            <InboxPanel
              tasks={tasks}
              tags={tags}
              selectedTaskId={selectedTaskId}
              onSelectTask={openTask}
              onCreateTask={handleCreateTask}
              onAddTaskToToday={handleAddTaskToToday}
              tagsEnabled={settings.tagsEnabled}
              onOpenRepeatSettings={(taskId) => setTaskModal({ type: "repeat", taskId })}
              onOpenTagSettings={(taskId) => setTaskModal({ type: "tags", taskId })}
            />
          </div>
        ) : null}

        {!isSubPageOpen && activeTab === "today" ? (
          <div className="tab-panel" role="tabpanel" aria-label="今日 3 件事">
            <TodayPanel
              tasks={tasks}
              tags={tags}
              selectedTaskId={selectedTaskId}
              onSelectTask={openTask}
              onRemoveTaskFromToday={(taskId) =>
                patchTask(taskId, { inToday: false, plannedDate: null })
              }
              tagsEnabled={settings.tagsEnabled}
              onOpenRepeatSettings={(taskId) => setTaskModal({ type: "repeat", taskId })}
              onOpenTagSettings={(taskId) => setTaskModal({ type: "tags", taskId })}
              energyEnabled={settings.energyEnabled}
              energyState={todayEnergyState}
              onEnergyChange={handleEnergyChange}
              onOpenCare={openCarePage}
              comfortEntries={todayComfortEntries}
              onComfortNoteChange={handleComfortNoteChange}
              onCompleteComfort={handleCompleteComfortEntry}
            />
          </div>
        ) : null}

        {!isSubPageOpen && activeTab === "settings" ? (
          <div className="tab-panel settings-tab-panel" role="tabpanel" aria-label="设置">
            <SettingsPage
              settings={settings}
              tags={tags}
              tasks={tasks}
              onToggleTags={(tagsEnabled) =>
                setSettings((currentSettings) => ({ ...currentSettings, tagsEnabled }))
              }
              onToggleNextStep={(nextStepEnabled) =>
                setSettings((currentSettings) => ({ ...currentSettings, nextStepEnabled }))
              }
              onToggleEnergy={(energyEnabled) =>
                setSettings((currentSettings) => ({ ...currentSettings, energyEnabled }))
              }
              onToggleCelebrationSound={(celebrationSoundEnabled) =>
                setSettings((currentSettings) => ({ ...currentSettings, celebrationSoundEnabled }))
              }
              onPreviewCelebration={() => playCelebration()}
              onCountdownPresetsChange={(countdownPresets) =>
                setSettings((currentSettings) => ({ ...currentSettings, countdownPresets }))
              }
              onCreateTag={handleCreateTag}
              onDeleteTag={handleDeleteTag}
            />
          </div>
        ) : null}
      </section>

      {!isSubPageOpen ? (
        <nav className="tab-bar" aria-label="主导航" role="tablist">
        {tabDefinitions.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button${activeTab === tab.id ? " active" : ""}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => selectTab(tab.id)}
          >
            <span className="tab-index" aria-hidden="true">
              {tab.index}
            </span>
            <span>{tab.label}</span>
            {tab.id === "today" && todayTaskCount > 0 ? (
              <span className="tab-badge">{todayTaskCount}</span>
            ) : null}
          </button>
          ))}
        </nav>
      ) : null}

      {modalTask && taskModal?.type === "repeat" ? (
        <RepeatModeModal
          task={modalTask}
          onSave={(repeatMode) => handleSaveRepeatMode(modalTask.id, repeatMode)}
          onClose={() => setTaskModal(null)}
        />
      ) : null}

      {modalTask && taskModal?.type === "tags" ? (
        <TagSelectionModal
          task={modalTask}
          tags={tags}
          onToggleTag={(tagId) => handleToggleTagForTask(modalTask.id, tagId)}
          onClose={() => setTaskModal(null)}
        />
      ) : null}
    </main>
  );
}
