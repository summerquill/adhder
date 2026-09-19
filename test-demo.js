const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const js = fs.readFileSync(path.join(root, "app.js"), "utf8");
const app = require("./app.js");

const requiredHtml = [
  "快速 Inbox",
  "收集",
  "今日 3 件事",
  "下一步建议",
  "开始计时",
  "任务状态",
  "5 分钟",
  "10 分钟",
  "15 分钟",
];

const requiredJs = [
  '"未开始"',
  '"进行中"',
  '"完成"',
  '"暂时放下"',
  "function makeNextStep",
  "function addTaskToToday",
  "function formatTime",
  "localStorage",
  "createdAt",
  "updatedAt",
];

const requiredCss = [".workspace", ".panel", ".timer-display", "@media"];

function assertContains(source, value, fileName) {
  assert(source.includes(value), `${fileName} should contain: ${value}`);
}

requiredHtml.forEach((value) => assertContains(html, value, "index.html"));
requiredJs.forEach((value) => assertContains(js, value, "app.js"));
requiredCss.forEach((value) => assertContains(css, value, "styles.css"));

assert.strictEqual(app.formatTime(0), "00:00");
assert.strictEqual(app.formatTime(5 * 60), "05:00");
assert.strictEqual(app.formatTime(15 * 60 + 9), "15:09");

assert.strictEqual(app.makeNextStep("整理房间"), "把最显眼的一样东西放回它该在的位置");
assert.strictEqual(app.makeNextStep("回复体检预约消息"), "打开对话框，只读一遍最新消息");
assert.strictEqual(app.makeNextStep("买洗衣液"), "打开购物 App，先搜索这个物品");
assert.strictEqual(app.makeNextStep("准备材料", 0), "把任务写成一个 5 分钟内能开始的动作");

const todayFullTasks = [
  { inToday: true },
  { inToday: true },
  { inToday: true },
];
const todayOpenTasks = [{ inToday: true }, { inToday: false }];
assert.strictEqual(app.canAddToToday(todayFullTasks), false);
assert.strictEqual(app.canAddToToday(todayOpenTasks), true);

const taskWhenOpen = app.createTask("整理厨房台面", todayOpenTasks);
assert.strictEqual(taskWhenOpen.status, "未开始");
assert.strictEqual(taskWhenOpen.inToday, true);
assert.strictEqual(taskWhenOpen.createdAt, taskWhenOpen.updatedAt);
assert(app.isValidTask(taskWhenOpen));

const taskWhenFull = app.createTask("买牛奶", todayFullTasks);
assert.strictEqual(taskWhenFull.inToday, false);
assert(app.isValidTask(taskWhenFull));

assert.deepStrictEqual(app.getTodayTasks(todayOpenTasks), [{ inToday: true }]);

console.log("ADHDer MVP checks passed.");
