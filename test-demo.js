const fs = require("fs");
const path = require("path");

const root = __dirname;
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const js = fs.readFileSync(path.join(root, "app.js"), "utf8");

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
];

const requiredCss = [".workspace", ".panel", ".timer-display", "@media"];

function assertContains(source, value, fileName) {
  if (!source.includes(value)) {
    throw new Error(`${fileName} should contain: ${value}`);
  }
}

requiredHtml.forEach((value) => assertContains(html, value, "index.html"));
requiredJs.forEach((value) => assertContains(js, value, "app.js"));
requiredCss.forEach((value) => assertContains(css, value, "styles.css"));

console.log("Demo structure checks passed.");
