# ADHDer 技术方案

## 文档目的

本方案明确 ADHDer 的两个实现阶段，避免验证版实现与正式产品技术栈长期混淆：

1. **阶段 1：验证版原生实现**：用于快速验证核心产品流程。
2. **阶段 2：产品化技术栈**：用于正式产品的持续开发、测试和部署。

当前仓库已经完成阶段 1，并完成 React + TypeScript + Vite 的产品化迁移，进入阶段 2。

## 阶段 1：验证版原生实现

### 目标

在尽量少的技术依赖下，验证用户是否能够顺畅完成以下闭环：

- 快速收集脑中的任务。
- 选择今天想优先推进的事项，并提供“3 件事”的建议提示。
- 把任务拆成一个可以马上开始的下一步。
- 通过正计时或 5、10、15 分钟倒计时记录投入并降低启动门槛。
- 使用四种状态记录真实进展。

### 实现方式

- 原生 HTML。
- 原生 CSS。
- 原生 JavaScript。
- `localStorage` 本地保存。
- 本地规则生成下一步建议。
- 无后端、无账号、无多设备同步。

### 完成状态

阶段 1 已验证完成。迁移前的原生实现保留在 Git 历史中，不再作为当前运行入口维护。

## 阶段 2：产品化技术栈

### 当前技术栈

#### 前端框架

- React 19
- TypeScript
- Vite

选择理由：

- React 适合管理任务列表、状态切换、选中任务和计时器等交互状态。
- TypeScript 为任务模型、状态枚举、存储数据和组件属性提供静态约束。
- Vite 提供快速开发、生产构建和测试集成，为正式部署建立基础。

#### 样式方案

当前继续使用 `src/styles/globals.css` 保存现有设计。

Tailwind CSS 是后续候选方案，但不作为本次产品化迁移的必要条件。待界面结构、设计 token 和组件边界稳定后，再评估是否引入，避免框架迁移和样式体系迁移同时发生。

#### 测试

- Vitest：业务逻辑、存储逻辑和组件测试。
- React Testing Library：关键组件交互测试。
- jsdom：浏览器环境模拟。

当前覆盖：

- 任务创建和数据校验。
- 首次启动为空，旧 Mock 数据过滤和旧任务迁移。
- 今日任务不使用数量上限。
- 下一步建议生成、编辑、重新生成和接受。
- 任务状态切换。
- 倒计时和正计时开始、暂停、继续、结束和重置。
- 按任务累计执行时间。
- 可替换 `TaskRepository` 和本地仓库实现。
- `localStorage` 读写和异常数据回退。

#### 数据存储

阶段 2 当前仍使用 `localStorage`，但业务代码通过 `TaskRepository` 接口访问存储：

- UI 和 App 状态管理不直接依赖 `localStorage`。
- `LocalTaskRepository` 负责本地读写、Mock 数据清理、旧字段迁移和异常回退。
- 后续可以新增 Supabase 实现，而不需要让组件感知存储来源。
- 存储键继续使用 `adhder.tasks.v1` 和 `adhder.selectedTaskId.v1`。
- 旧任务缺少 `timeSpentSeconds` 时自动补为 `0`。
- `id` 以 `seed-` 开头的历史 Mock 任务会被过滤。

后续在需要账号、多设备同步或云端备份时再引入后端，优先评估 Supabase。正式同步计时时间时，应使用可幂等的计时记录，而不是直接覆盖累计秒数。

#### 任务拆解

当前继续使用本地 mock 规则，后续接入真实 AI 时替换建议生成逻辑，保持现有组件交互不变。

### 应用结构

```text
src/
  app/
    App.tsx
    App.test.tsx
  components/
    InboxPanel.tsx
    TodayPanel.tsx
    TaskDetailPanel.tsx
    TimerControl.tsx
    StatusSelector.tsx
    TaskCard.tsx
  domain/
    task.ts
    nextStep.ts
    timer.ts
  storage/
    TaskRepository.ts
    TaskRepositoryContext.tsx
    localTaskRepository.ts
  styles/
    globals.css
  test/
    setup.ts
  main.tsx
  vite-env.d.ts
```

各部分职责：

- `app/`：组合页面并管理任务、选中状态和跨组件操作。
- `components/`：展示界面并触发现有业务动作。
- `domain/`：任务类型、状态枚举、下一步建议和计时格式规则。
- `storage/`：定义可替换仓库接口，并由本地实现负责 `localStorage`、迁移和回退。
- `styles/`：保存全局样式和后续设计系统入口。
- `test/`：测试环境和公共初始化。

## 核心数据模型

```ts
type TaskStatus = "未开始" | "进行中" | "完成" | "暂时放下";

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  nextStep: string;
  inToday: boolean;
  timeSpentSeconds: number;
  createdAt: string;
  updatedAt: string;
};
```

今日重点继续由 `inToday` 标记实现，“3 件事”只作为产品建议，不设置数量上限。后续如果需要保留每天的选择历史，再引入独立的 `DailyPlan` 模型。

## 关键交互流程

### 快速 Inbox

用户输入任务标题后创建任务并保存到本地。新任务默认加入今日，不受任务数量限制。首次使用或本地没有有效任务时，Inbox 保持空状态。

### 今日 3 件事

用户可以从 Inbox 中把任务加入今日列表。产品建议先关注 1～3 件，但可以继续添加，不出现“今日已满”。任务也可以随时移出今日。

### 任务拆成下一步

用户选中任务后可以：

- 查看系统建议。
- 接受建议。
- 手动编辑。
- 重新生成建议。

建议生成逻辑位于 `src/domain/nextStep.ts`，后续可以直接替换为 AI 调用。

### 计时器

用户可以选择倒计时或正计时。倒计时提供 5、10 或 15 分钟，正计时从 0 开始累计。开始计时时，如果任务仍为“未开始”，自动切换为“进行中”。

两种模式都会按任务累计实际执行时间，显示在任务详情和任务卡片中。暂停、重置和切换任务不会删除已经累计的历史时间；重置只重置当前计时会话。

### 任务状态

每个任务支持四种状态。状态变化会立即更新 React 状态并通过 `TaskRepository` 持久化。

## 开发与验证命令

```bash
npm install
npm run dev
npm run typecheck
npm test
npm run build
npm run preview
```

`npm run dev` 和 `npm run preview` 都使用 `http://localhost:4173/`。

不要使用 `python3 -m http.server 4173` 直接托管项目根目录。Python 的静态文件服务器不会编译 `src/main.tsx` 和 TypeScript 模块，浏览器会因无法加载 Vite 入口而显示空白页。生产验证应运行 `npm run build` 后使用 `npm run preview`。

交付要求：

- `npm run typecheck` 通过。
- `npm test` 通过。
- `npm run build` 通过。
- 数据迁移或存储结构发生变化时，必须同步增加兼容性测试。

## 后续演进

### 产品化基础

- 接入真实 AI 生成下一步建议。
- 引入 Supabase Auth 和 Postgres。
- 支持云端同步和数据迁移。
- 增加 PWA 离线支持和通知提醒。
- 根据设计系统成熟度评估 Tailwind CSS。

### 暂不做

- 复杂日历。
- 项目管理功能。
- 情绪复盘和自我觉察。
- 统计仪表盘。
- 社交监督和协作功能。
