const TASK_STORAGE_KEY = "adhder.tasks.v1";
const SELECTED_TASK_STORAGE_KEY = "adhder.selectedTaskId.v1";
const statuses = ["未开始", "进行中", "完成", "暂时放下"];

const stepSuggestions = [
  "把任务写成一个 5 分钟内能开始的动作",
  "打开相关页面或工具，只先看一眼",
  "把需要用到的东西放到手边",
  "先完成最小的一步，不处理后续细节",
];

const seedTasks = [
  {
    id: "seed-1",
    title: "整理房间",
    status: "进行中",
    inToday: true,
    nextStep: "把地上的衣服放进洗衣篮",
    createdAt: "2026-09-19T00:00:00.000Z",
    updatedAt: "2026-09-19T00:00:00.000Z",
  },
  {
    id: "seed-2",
    title: "回复体检预约消息",
    status: "未开始",
    inToday: true,
    nextStep: "打开聊天窗口，先确认对方发来的可选时间",
    createdAt: "2026-09-19T00:01:00.000Z",
    updatedAt: "2026-09-19T00:01:00.000Z",
  },
  {
    id: "seed-3",
    title: "买洗衣液",
    status: "未开始",
    inToday: false,
    nextStep: "打开购物 App，搜索常买的洗衣液",
    createdAt: "2026-09-19T00:02:00.000Z",
    updatedAt: "2026-09-19T00:02:00.000Z",
  },
  {
    id: "seed-4",
    title: "整理下周要交的材料",
    status: "暂时放下",
    inToday: false,
    nextStep: "新建一个文件夹，把已有材料先拖进去",
    createdAt: "2026-09-19T00:03:00.000Z",
    updatedAt: "2026-09-19T00:03:00.000Z",
  },
];

let tasks = [];
let selectedTaskId = null;
let selectedMinutes = 5;
let remainingSeconds = selectedMinutes * 60;
let timerId = null;

let inboxForm;
let taskInput;
let inboxList;
let todayList;
let todayCount;
let selectedTask;
let nextStepInput;
let regenerateStep;
let timerDisplay;
let timerOptions = [];
let startTimer;
let resetTimer;
let statusOptions;

function cloneTasks(items) {
  return items.map((task) => ({ ...task }));
}

function isValidTask(task) {
  return (
    task &&
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    statuses.includes(task.status) &&
    typeof task.nextStep === "string" &&
    typeof task.inToday === "boolean" &&
    typeof task.createdAt === "string" &&
    typeof task.updatedAt === "string"
  );
}

function loadTasks() {
  try {
    if (typeof window === "undefined") return cloneTasks(seedTasks);
    const saved = window.localStorage.getItem(TASK_STORAGE_KEY);
    if (!saved) return cloneTasks(seedTasks);

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return cloneTasks(seedTasks);

    const validTasks = parsed.filter(isValidTask);
    return validTasks.length ? validTasks : cloneTasks(seedTasks);
  } catch {
    return cloneTasks(seedTasks);
  }
}

function saveTasks() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
}

function loadSelectedTaskId(items) {
  if (typeof window === "undefined") return items[0] ? items[0].id : null;
  const savedId = window.localStorage.getItem(SELECTED_TASK_STORAGE_KEY);
  if (items.some((task) => task.id === savedId)) return savedId;
  return items[0] ? items[0].id : null;
}

function saveSelectedTaskId() {
  if (typeof window === "undefined") return;
  if (selectedTaskId) {
    window.localStorage.setItem(SELECTED_TASK_STORAGE_KEY, selectedTaskId);
  } else {
    window.localStorage.removeItem(SELECTED_TASK_STORAGE_KEY);
  }
}

function persist() {
  saveTasks();
  saveSelectedTaskId();
}

function touchTask(task) {
  task.updatedAt = new Date().toISOString();
}

function getSelectedTask() {
  return tasks.find((task) => task.id === selectedTaskId) || tasks[0] || null;
}

function getTodayTasks(items = tasks) {
  return items.filter((task) => task.inToday);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

function makeNextStep(title, fallbackIndex = null) {
  if (title.includes("房间") || title.includes("整理")) return "把最显眼的一样东西放回它该在的位置";
  if (title.includes("回复") || title.includes("消息")) return "打开对话框，只读一遍最新消息";
  if (title.includes("买") || title.includes("采购")) return "打开购物 App，先搜索这个物品";

  const index =
    fallbackIndex === null
      ? Math.floor(Math.random() * stepSuggestions.length)
      : fallbackIndex % stepSuggestions.length;
  return stepSuggestions[index];
}

function canAddToToday(items = tasks) {
  return getTodayTasks(items).length < 3;
}

function createTask(title, existingTasks = tasks) {
  const now = new Date().toISOString();
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    status: "未开始",
    inToday: canAddToToday(existingTasks),
    nextStep: makeNextStep(title),
    createdAt: now,
    updatedAt: now,
  };
}

function setSelectedTask(taskId) {
  selectedTaskId = taskId;
  saveSelectedTaskId();
  syncSelectedTask();
}

function updateTask(task, patch) {
  Object.assign(task, patch);
  touchTask(task);
  persist();
}

function renderTaskCard(task, location) {
  const item = document.createElement("article");
  item.className = `task-item${task.id === selectedTaskId ? " selected" : ""}`;

  const title = document.createElement("p");
  title.className = "task-title";
  title.textContent = task.title;

  const meta = document.createElement("div");
  meta.className = "task-meta";

  const status = document.createElement("span");
  status.className = "badge";
  status.textContent = task.status;

  const nextStep = document.createElement("span");
  nextStep.textContent = task.nextStep;

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const selectButton = document.createElement("button");
  selectButton.className = "task-action";
  selectButton.type = "button";
  selectButton.textContent = "查看";
  selectButton.addEventListener("click", () => setSelectedTask(task.id));

  const moveButton = document.createElement("button");
  moveButton.className = "task-action";
  moveButton.type = "button";

  if (location === "inbox") {
    const todayFull = !task.inToday && !canAddToToday();
    moveButton.textContent = task.inToday ? "已在今日" : todayFull ? "今日已满" : "加入今日";
    moveButton.disabled = task.inToday || todayFull;
    moveButton.addEventListener("click", () => addTaskToToday(task.id));
  } else {
    moveButton.textContent = "移出今日";
    moveButton.addEventListener("click", () => {
      updateTask(task, { inToday: false });
      render();
    });
  }

  meta.append(status, nextStep);
  actions.append(selectButton, moveButton);
  item.append(title, meta, actions);
  return item;
}

function addTaskToToday(taskId) {
  if (!canAddToToday()) return false;

  const task = tasks.find((item) => item.id === taskId);
  if (!task) return false;

  updateTask(task, { inToday: true });
  selectedTaskId = task.id;
  persist();
  render();
  return true;
}

function renderInbox() {
  inboxList.replaceChildren();
  if (!tasks.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Inbox 现在是空的。";
    inboxList.append(empty);
    return;
  }

  tasks.forEach((task) => inboxList.append(renderTaskCard(task, "inbox")));
}

function renderToday() {
  const todayTasks = getTodayTasks();
  todayCount.textContent = todayTasks.length;
  todayList.replaceChildren();

  if (!todayTasks.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "从 Inbox 里选一件今天想推进的事。";
    todayList.append(empty);
    return;
  }

  todayTasks.forEach((task) => todayList.append(renderTaskCard(task, "today")));
}

function renderSelectedTask() {
  const task = getSelectedTask();
  selectedTask.replaceChildren();

  if (!task) {
    const title = document.createElement("h3");
    title.textContent = "还没有选中任务";
    const helper = document.createElement("p");
    helper.textContent = "先在 Inbox 里收集一件事，再把它拆成下一步。";
    selectedTask.append(title, helper);
    nextStepInput.value = "";
    nextStepInput.disabled = true;
    regenerateStep.disabled = true;
    return;
  }

  const title = document.createElement("h3");
  title.textContent = task.title;
  const status = document.createElement("p");
  status.textContent = `当前状态：${task.status}`;
  selectedTask.append(title, status);
  nextStepInput.value = task.nextStep;
  nextStepInput.disabled = false;
  regenerateStep.disabled = false;
}

function renderStatuses() {
  const task = getSelectedTask();
  statusOptions.replaceChildren();

  statuses.forEach((status) => {
    const button = document.createElement("button");
    button.className = `status-option${task && task.status === status ? " active" : ""}`;
    button.type = "button";
    button.textContent = status;
    button.disabled = !task;
    button.addEventListener("click", () => {
      updateTask(task, { status });
      render();
    });
    statusOptions.append(button);
  });
}

function renderTimerOptions() {
  timerOptions.forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.minutes) === selectedMinutes);
    button.disabled = Boolean(timerId);
  });
  timerDisplay.textContent = formatTime(remainingSeconds);
}

function render() {
  renderInbox();
  renderToday();
  renderSelectedTask();
  renderStatuses();
  renderTimerOptions();
}

function syncSelectedTask() {
  renderSelectedTask();
  renderStatuses();
  renderInbox();
  renderToday();
}

function resetTimerState(minutes = selectedMinutes) {
  window.clearInterval(timerId);
  timerId = null;
  selectedMinutes = minutes;
  remainingSeconds = selectedMinutes * 60;
  startTimer.textContent = "开始";
  renderTimerOptions();
}

function bootApp() {
  tasks = loadTasks();
  selectedTaskId = loadSelectedTaskId(tasks);

  inboxForm = document.querySelector("#inboxForm");
  taskInput = document.querySelector("#taskInput");
  inboxList = document.querySelector("#inboxList");
  todayList = document.querySelector("#todayList");
  todayCount = document.querySelector("#todayCount");
  selectedTask = document.querySelector("#selectedTask");
  nextStepInput = document.querySelector("#nextStepInput");
  regenerateStep = document.querySelector("#regenerateStep");
  timerDisplay = document.querySelector("#timerDisplay");
  timerOptions = document.querySelectorAll(".timer-option");
  startTimer = document.querySelector("#startTimer");
  resetTimer = document.querySelector("#resetTimer");
  statusOptions = document.querySelector("#statusOptions");

  inboxForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = taskInput.value.trim();
    if (!title) return;

    const task = createTask(title);
    tasks = [task, ...tasks];
    selectedTaskId = task.id;
    taskInput.value = "";
    persist();
    render();
  });

  nextStepInput.addEventListener("input", () => {
    const task = getSelectedTask();
    if (!task) return;

    task.nextStep = nextStepInput.value;
    touchTask(task);
    persist();
    renderInbox();
    renderToday();
  });

  regenerateStep.addEventListener("click", () => {
    const task = getSelectedTask();
    if (!task) return;
    updateTask(task, { nextStep: makeNextStep(task.title) });
    syncSelectedTask();
  });

  timerOptions.forEach((button) => {
    button.addEventListener("click", () => resetTimerState(Number(button.dataset.minutes)));
  });

  startTimer.addEventListener("click", () => {
    const task = getSelectedTask();
    if (task && task.status === "未开始") updateTask(task, { status: "进行中" });

    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
      startTimer.textContent = "继续";
      render();
      return;
    }

    if (remainingSeconds === 0) remainingSeconds = selectedMinutes * 60;
    startTimer.textContent = "暂停";
    timerId = window.setInterval(() => {
      remainingSeconds = Math.max(0, remainingSeconds - 1);
      timerDisplay.textContent = formatTime(remainingSeconds);

      if (remainingSeconds === 0) {
        window.clearInterval(timerId);
        timerId = null;
        startTimer.textContent = "再来一次";
        renderTimerOptions();
      }
    }, 1000);
    render();
  });

  resetTimer.addEventListener("click", () => resetTimerState());

  persist();
  render();
}

if (typeof document !== "undefined") bootApp();

if (typeof module !== "undefined") {
  module.exports = {
    TASK_STORAGE_KEY,
    statuses,
    seedTasks,
    canAddToToday,
    createTask,
    formatTime,
    getTodayTasks,
    isValidTask,
    makeNextStep,
  };
}
