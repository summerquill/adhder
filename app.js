const statuses = ["未开始", "进行中", "完成", "暂时放下"];

const stepSuggestions = [
  "把任务写成一个 5 分钟内能开始的动作",
  "打开相关页面或工具，只先看一眼",
  "把需要用到的东西放到手边",
  "先完成最小的一步，不处理后续细节",
];

let tasks = [
  {
    id: 1,
    title: "整理房间",
    status: "进行中",
    inToday: true,
    nextStep: "把地上的衣服放进洗衣篮",
  },
  {
    id: 2,
    title: "回复体检预约消息",
    status: "未开始",
    inToday: true,
    nextStep: "打开聊天窗口，先确认对方发来的可选时间",
  },
  {
    id: 3,
    title: "买洗衣液",
    status: "未开始",
    inToday: false,
    nextStep: "打开购物 App，搜索常买的洗衣液",
  },
  {
    id: 4,
    title: "整理下周要交的材料",
    status: "暂时放下",
    inToday: false,
    nextStep: "新建一个文件夹，把已有材料先拖进去",
  },
];

let selectedTaskId = 1;
let selectedMinutes = 5;
let remainingSeconds = selectedMinutes * 60;
let timerId = null;

const inboxForm = document.querySelector("#inboxForm");
const taskInput = document.querySelector("#taskInput");
const inboxList = document.querySelector("#inboxList");
const todayList = document.querySelector("#todayList");
const todayCount = document.querySelector("#todayCount");
const selectedTask = document.querySelector("#selectedTask");
const nextStepInput = document.querySelector("#nextStepInput");
const regenerateStep = document.querySelector("#regenerateStep");
const timerDisplay = document.querySelector("#timerDisplay");
const timerOptions = document.querySelectorAll(".timer-option");
const startTimer = document.querySelector("#startTimer");
const resetTimer = document.querySelector("#resetTimer");
const statusOptions = document.querySelector("#statusOptions");

function getSelectedTask() {
  return tasks.find((task) => task.id === selectedTaskId) || tasks[0];
}

function getTodayTasks() {
  return tasks.filter((task) => task.inToday);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

function makeNextStep(title) {
  if (title.includes("房间") || title.includes("整理")) return "把最显眼的一样东西放回它该在的位置";
  if (title.includes("回复") || title.includes("消息")) return "打开对话框，只读一遍最新消息";
  if (title.includes("买") || title.includes("采购")) return "打开购物 App，先搜索这个物品";
  return stepSuggestions[Math.floor(Math.random() * stepSuggestions.length)];
}

function renderTaskCard(task, location) {
  const item = document.createElement("article");
  item.className = `task-item${task.id === selectedTaskId ? " selected" : ""}`;

  const title = document.createElement("p");
  title.className = "task-title";
  title.textContent = task.title;

  const meta = document.createElement("div");
  meta.className = "task-meta";
  meta.innerHTML = `<span class="badge">${task.status}</span><span>${task.nextStep}</span>`;

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const selectButton = document.createElement("button");
  selectButton.className = "task-action";
  selectButton.type = "button";
  selectButton.textContent = "查看";
  selectButton.addEventListener("click", () => {
    selectedTaskId = task.id;
    syncSelectedTask();
  });

  const moveButton = document.createElement("button");
  moveButton.className = "task-action";
  moveButton.type = "button";

  if (location === "inbox") {
    moveButton.textContent = task.inToday ? "已在今日" : "加入今日";
    moveButton.disabled = task.inToday;
    moveButton.addEventListener("click", () => addTaskToToday(task.id));
  } else {
    moveButton.textContent = "移出今日";
    moveButton.addEventListener("click", () => {
      task.inToday = false;
      if (selectedTaskId === task.id) selectedTaskId = tasks[0] ? tasks[0].id : null;
      render();
    });
  }

  actions.append(selectButton, moveButton);
  item.append(title, meta, actions);
  return item;
}

function addTaskToToday(taskId) {
  const todayTasks = getTodayTasks();
  if (todayTasks.length >= 3) return;

  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;

  task.inToday = true;
  selectedTaskId = task.id;
  render();
}

function renderInbox() {
  inboxList.innerHTML = "";
  if (!tasks.length) {
    inboxList.innerHTML = '<div class="empty-state">Inbox 现在是空的。</div>';
    return;
  }

  tasks.forEach((task) => inboxList.append(renderTaskCard(task, "inbox")));
}

function renderToday() {
  const todayTasks = getTodayTasks();
  todayCount.textContent = todayTasks.length;
  todayList.innerHTML = "";

  if (!todayTasks.length) {
    todayList.innerHTML = '<div class="empty-state">从 Inbox 里选一件今天想推进的事。</div>';
    return;
  }

  todayTasks.forEach((task) => todayList.append(renderTaskCard(task, "today")));
}

function renderSelectedTask() {
  const task = getSelectedTask();
  if (!task) return;

  selectedTask.innerHTML = `
    <h3>${task.title}</h3>
    <p>当前状态：${task.status}</p>
  `;
  nextStepInput.value = task.nextStep;
}

function renderStatuses() {
  const task = getSelectedTask();
  statusOptions.innerHTML = "";

  statuses.forEach((status) => {
    const button = document.createElement("button");
    button.className = `status-option${task && task.status === status ? " active" : ""}`;
    button.type = "button";
    button.textContent = status;
    button.addEventListener("click", () => {
      task.status = status;
      render();
    });
    statusOptions.append(button);
  });
}

function renderTimerOptions() {
  timerOptions.forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.minutes) === selectedMinutes);
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

inboxForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = taskInput.value.trim();
  if (!title) return;

  const task = {
    id: Date.now(),
    title,
    status: "未开始",
    inToday: getTodayTasks().length < 3,
    nextStep: makeNextStep(title),
  };

  tasks = [task, ...tasks];
  selectedTaskId = task.id;
  taskInput.value = "";
  render();
});

nextStepInput.addEventListener("input", () => {
  const task = getSelectedTask();
  if (task) task.nextStep = nextStepInput.value;
  renderInbox();
  renderToday();
});

regenerateStep.addEventListener("click", () => {
  const task = getSelectedTask();
  if (!task) return;
  task.nextStep = makeNextStep(task.title);
  syncSelectedTask();
});

timerOptions.forEach((button) => {
  button.addEventListener("click", () => resetTimerState(Number(button.dataset.minutes)));
});

startTimer.addEventListener("click", () => {
  const task = getSelectedTask();
  if (task && task.status === "未开始") task.status = "进行中";

  if (timerId) {
    window.clearInterval(timerId);
    timerId = null;
    startTimer.textContent = "继续";
    render();
    return;
  }

  startTimer.textContent = "暂停";
  timerId = window.setInterval(() => {
    remainingSeconds = Math.max(0, remainingSeconds - 1);
    timerDisplay.textContent = formatTime(remainingSeconds);

    if (remainingSeconds === 0) {
      window.clearInterval(timerId);
      timerId = null;
      startTimer.textContent = "再来一次";
    }
  }, 1000);
  render();
});

resetTimer.addEventListener("click", () => resetTimerState());

render();
