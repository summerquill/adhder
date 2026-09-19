# ADHDer MVP 技术方案

## 技术方向

ADHDer MVP 先按本地优先、移动端优先的轻量 Web App 实现。

第一阶段重点是验证核心使用流程是否顺畅：快速收集任务、选择今日 3 件事、拆成下一步、启动短计时、记录任务状态。因此技术方案应尽量轻，避免过早引入复杂后端、账号体系和同步逻辑。

## 推荐技术栈

### 前端

- React
- TypeScript
- Vite
- Tailwind CSS

选择理由：

- React 适合实现任务列表、状态切换、计时器和当前选中任务等状态驱动界面。
- TypeScript 可以让任务模型、状态枚举和计时逻辑更稳定。
- Vite 启动快、配置轻，适合 MVP 快速迭代。
- Tailwind CSS 可以快速搭建界面，同时保留后续抽象设计系统的空间。

### 数据存储

MVP 阶段先使用 `localStorage`。

选择理由：

- 不需要后端即可保存用户任务。
- 实现成本低，适合快速验证产品流程。
- 当前数据量小，任务结构简单，暂时不需要 IndexedDB 或数据库。

后续如果需要更复杂的离线数据、历史记录或大量结构化内容，可以再评估 IndexedDB。

### 任务拆解

MVP 阶段先使用本地 mock 规则生成“下一步建议”。

示例规则：

- 包含“整理”：建议先把最显眼的一样东西归位。
- 包含“回复”：建议先打开对话框读一遍消息。
- 包含“买”：建议先打开购物 App 搜索物品。

选择理由：

- 可以先验证“任务拆成下一步”的交互是否真的有帮助。
- 避免一开始引入 AI API、费用、网络失败和提示词调试成本。
- 后续接入真实 AI 时，可以保持同一套前端交互，只替换建议生成逻辑。

### 后端

MVP 阶段暂不需要后端。

等产品需要账号、多设备同步、云端备份或真实 AI 调用代理时，再引入后端服务。

后续优先考虑 Supabase：

- 提供认证、数据库和权限控制。
- 适合个人效率工具快速产品化。
- 可以比较自然地支持多设备同步。

## MVP 应用结构

建议正式项目使用以下结构：

```text
src/
  app/
    App.tsx
  components/
    InboxPanel.tsx
    TodayPanel.tsx
    TaskDetailPanel.tsx
    TimerControl.tsx
    StatusSelector.tsx
  domain/
    task.ts
    nextStep.ts
  storage/
    taskStorage.ts
  styles/
    globals.css
```

各部分职责：

- `components/`：负责界面组件。
- `domain/`：负责任务类型、状态枚举、下一步建议规则等业务逻辑。
- `storage/`：负责 localStorage 读写和数据迁移。
- `styles/`：放全局样式和 Tailwind 入口。

## 核心数据模型

MVP 阶段可以先使用一个简单任务模型：

```ts
type TaskStatus = "未开始" | "进行中" | "完成" | "暂时放下";

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  nextStep: string;
  inToday: boolean;
  createdAt: string;
  updatedAt: string;
};
```

今日 3 件事可以先用 `inToday` 标记实现。后续如果需要按日期保留每天的选择记录，再扩展为独立的 `DailyPlan` 模型。

## 关键交互流程

### 快速 Inbox

用户输入任务标题后，系统创建任务并保存到本地。

如果今日任务少于 3 个，可以考虑默认加入今日；如果已经满 3 个，则只进入 Inbox。

### 今日 3 件事

用户可以从 Inbox 中把任务加入今日列表。

当今日任务已经达到 3 个时，加入按钮应禁用或提示今日已满。

### 任务拆成下一步

用户选中任务后，系统展示下一步建议。

用户可以：

- 接受建议。
- 手动编辑。
- 重新生成。

MVP 阶段重新生成走本地规则，后续可以接入 AI。

### 计时器

用户可以选择 5、10 或 15 分钟。

点击开始后，如果任务仍是“未开始”，可以自动切换为“进行中”。

计时器只负责帮助启动，不要求用户必须完成任务。

### 任务状态

任务支持以下状态：

- 未开始
- 进行中
- 完成
- 暂时放下

状态切换应立即保存到本地。

## 测试与验证

MVP 阶段建议至少覆盖：

- 任务创建。
- 今日任务最多 3 个。
- 任务状态切换。
- 下一步建议生成。
- 计时器开始、暂停和重置。
- localStorage 读写。

推荐测试工具：

- Vitest：单元测试业务逻辑和存储逻辑。
- React Testing Library：测试关键组件交互。
- Playwright：后续用于端到端流程测试。

## 后续演进

### 阶段 1：本地可用 MVP

- React + TypeScript + Vite + Tailwind CSS
- localStorage 保存任务
- 本地规则生成下一步建议
- 无账号、无后端

### 阶段 2：真实产品化

- Supabase Auth
- Supabase Postgres
- 云端同步
- OpenAI API 生成下一步建议
- PWA 离线支持
- 通知提醒

## 当前不做

- 完整后端系统
- 用户账号和登录
- 多设备同步
- 复杂日历
- 项目管理
- 情绪复盘和自我觉察
- 统计仪表盘

这些能力可以在核心流程验证通过后逐步加入。
