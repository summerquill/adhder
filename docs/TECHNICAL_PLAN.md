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
- 可替换 `TaskRepository` 和 `TagRepository`，以及对应本地实现。
- 多层标签创建、路径解析、任务多标签关联和级联删除。
- 标签功能默认关闭，开启后显示设置页、任务标签和时间统计。
- 父标签时间聚合与同一分支去重。
- 三 Tab 底部导航、任务详情页返回和长列表内部滚动。
- Inbox 循环模式弹窗、标签快捷选择和对应持久化。
- 下一步建议区域可配置显示或隐藏。
- 最多 3 个、支持 1～180 分钟的倒计时快捷选项。
- `localStorage` 读写和异常数据回退。

#### 数据存储

阶段 2 当前仍使用 `localStorage`，但业务代码通过 `TaskRepository` 和 `TagRepository` 接口访问存储：

- UI 和 App 状态管理不直接依赖 `localStorage`。
- `LocalTaskRepository` 负责任务、选中状态、Mock 数据清理、旧字段迁移和异常回退。
- `LocalTagRepository` 负责标签和个性化设置的本地持久化。
- 后续可以新增 Supabase 实现，而不需要让组件感知存储来源。
- 任务存储键继续使用 `adhder.tasks.v1` 和 `adhder.selectedTaskId.v1`。
- 标签和设置使用 `adhder.tags.v1` 和 `adhder.settings.v1`。
- 旧任务缺少 `tagIds`、`repeatMode` 或 `timeSpentSeconds` 时分别补为 `[]`、`none` 和 `0`。
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
    RepeatModeModal.tsx
    SettingsPage.tsx
    TagSelectionModal.tsx
    TimerPresetSettings.tsx
    TagManager.tsx
    TagSelector.tsx
    TagTimeStats.tsx
  domain/
    task.ts
    tag.ts
    tagStats.ts
    repeat.ts
    nextStep.ts
    timer.ts
  storage/
    TaskRepository.ts
    TaskRepositoryContext.tsx
    localTaskRepository.ts
    TagRepository.ts
    TagRepositoryContext.tsx
    localTagRepository.ts
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

## 轻量系统设计

当前产品仍是单端、本地优先的 Web App，不需要复杂的微服务设计。但 React 组件、领域逻辑和存储实现已经形成边界，因此现在适合维护一份轻量系统设计，记录组件职责和依赖方向。

### 组件清单

| 组件 | 类型 | 主要职责 | 直接依赖 |
| --- | --- | --- | --- |
| `main.tsx` | 启动入口 | 挂载 React、注入任务和标签 Repository、加载全局样式 | React、两个 Repository Provider 和本地实现 |
| `App.tsx` | 状态容器与应用编排 | 加载任务/标签快照、管理三个 Tab、任务详情页和弹窗、协调设置与持久化 | 业务面板、设置页、弹窗、领域逻辑、两个 Repository Context |
| `InboxPanel.tsx` | 输入与 Inbox 面板 | 创建任务、展示全部任务、选择任务、加入今日 | `TaskCard`、`Task` 类型 |
| `TodayPanel.tsx` | 今日重点面板 | 展示今日任务、选择任务、移出今日 | `TaskCard`、任务领域函数 |
| `TaskDetailPanel.tsx` | 当前任务操作面板 | 组合下一步建议、可选标签、计时器和状态选择器 | `TagSelector`、`TimerControl`、`StatusSelector` |
| `TaskCard.tsx` | 任务展示卡片 | 展示标题、状态、下一步、循环、累计时间和操作按钮 | 循环/计时格式化、`Task` 类型 |
| `TimerControl.tsx` | 有状态交互组件 | 管理倒计时/正计时会话、控制运行状态、上报执行秒数 | `task`、`timer` 领域模块 |
| `StatusSelector.tsx` | 受控交互组件 | 展示并提交四种任务状态 | `statuses`、`Task` 类型 |
| `SettingsPage.tsx` | 个性化设置页 | 控制标签和下一步建议开关，组合倒计时、标签管理和时间统计 | `TimerPresetSettings`、`TagManager`、`TagTimeStats` |
| `TimerPresetSettings.tsx` | 倒计时设置 | 添加、删除并限制最多 3 个自定义倒计时 | `UserSettings` |
| `RepeatModeModal.tsx` | 循环设置弹窗 | 设置任务的循环规则 | `repeat`、`Task` |
| `TagSelectionModal.tsx` | 标签选择弹窗 | 在 Inbox 为任务快速添加或移除多个标签 | `tag`、`Task` |
| `TagManager.tsx` | 标签管理 | 创建任意层级标签、展示层级和删除标签树 | `Tag` 领域函数 |
| `TagSelector.tsx` | 可选任务标签控件 | 为当前任务添加和移除多个标签 | `Tag` 领域函数 |
| `TagTimeStats.tsx` | 标签统计 | 展示直接时间和包含子标签的去重总时间 | `tagStats`、`timer` |
| `domain/task.ts` | 领域模型 | 任务类型、状态、校验、迁移、创建、更新、标签关联和时间累计 | `nextStep` |
| `domain/tag.ts` | 标签领域模型 | 标签层级、路径、后代、排序、创建和设置迁移 | 无 React、无存储 |
| `domain/tagStats.ts` | 统计领域逻辑 | 按标签层级聚合任务去重后的执行时间 | `tag`、`task` |
| `domain/repeat.ts` | 循环领域逻辑 | 循环模式类型、迁移和展示文案 | 无 React、无存储 |
| `domain/nextStep.ts` | 领域逻辑 | 根据任务标题生成和轮换下一步建议 | 无 React、无存储 |
| `domain/timer.ts` | 领域逻辑 | 计时模式类型和时长格式化 | 无 React、无存储 |
| `storage/TaskRepository.ts` | 存储接口 | 定义加载快照、保存任务和保存选中任务的操作 | `Task` 类型 |
| `storage/TaskRepositoryContext.tsx` | 依赖注入边界 | 向 React 组件提供 Repository，不暴露具体实现 | `TaskRepository` |
| `storage/localTaskRepository.ts` | 基础设施实现 | 使用 `localStorage`、清理 Mock、迁移旧任务和回退异常 | Task 领域模型 |
| `storage/TagRepository.ts` | 标签存储接口 | 定义标签和个性化设置的加载与保存 | `Tag`、`UserSettings` |
| `storage/TagRepositoryContext.tsx` | 标签依赖注入边界 | 向 React 组件提供标签 Repository | `TagRepository` |
| `storage/localTagRepository.ts` | 标签基础设施实现 | 使用 `localStorage` 保存标签和设置并处理异常 | Tag 领域模型 |
| `test/` | 测试支持 | 测试环境、公共任务 Fixture 和初始化逻辑 | 不进入生产代码 |

### 依赖方向

```text
main.tsx
  ├─ App tab bar (Inbox / Today / Action / Settings)
  ├─ TaskRepositoryProvider
  │    └─ LocalTaskRepository ──> localStorage
  ├─ TagRepositoryProvider
  │    └─ LocalTagRepository ──> localStorage
  └─ App
       ├─ InboxPanel ─────> TaskCard
       ├─ TodayPanel ─────> TaskCard
       ├─ TaskDetailPanel
       │    ├─ TagSelector ──> domain/tag
       │    ├─ TimerControl ──> domain/timer
       │    └─ StatusSelector
       ├─ SettingsPage
       │    ├─ TimerPresetSettings
       │    ├─ TagManager ──> domain/tag
       │    └─ TagTimeStats ──> domain/tagStats
       ├─ domain/task
       ├─ domain/nextStep
       ├─ TaskRepository 接口
       └─ TagRepository 接口
```

未来接入 Supabase 时，新增 `SupabaseTaskRepository` 和 `SupabaseTagRepository` 并替换 Provider 注入即可，不需要让面板组件知道数据来自本地还是云端。

### 数据流

1. **启动**：`main` 注入任务和标签 Repository，`App` 并行加载 `TaskSnapshot` 与 `TagSettingsSnapshot` 后进入可交互状态。
2. **任务操作**：面板通过 props 触发 `App` 操作，`App` 更新 React 状态，再由 effect 调用 Repository 持久化。
3. **计时**：`TimerControl` 每秒上报一次 `taskId` 和新增秒数，`App` 通过 `addTimeSpent` 更新对应任务，随后由 Repository 保存。
4. **标签操作**：设置页创建标签树，任务详情为任务添加或移除标签；删除标签时同时清理后代标签和任务关联。
5. **时间统计**：统计只在标签开启时展示。父标签收集整个后代分支的任务并按任务 ID 去重，再汇总 `timeSpentSeconds`。
6. **未来云端同步**：Repository 负责本地与远端协调，UI 和领域组件仍只处理 `Task`、`Tag` 和 `UserSettings`，不直接处理网络请求。

### 边界原则

- 组件不直接导入 `localStorage`，也不创建具体 Repository。
- 领域模块不依赖 React、浏览器存储或网络。
- 标签关闭只影响展示，不删除标签或任务关联。
- Repository 不负责界面状态，只负责数据读取、写入和迁移。
- `App` 负责当前编排，不承载新的基础设施细节；如果继续增长，再提取 `useTaskState`、`useTaskTimer` 或应用服务层。

### 何时拆分独立 System Design

在以下条件出现前，保持“技术方案中的一个轻量章节”即可：

- 引入 Supabase Auth、Postgres、云同步或离线队列。
- 出现多个客户端或前后端独立部署。
- 需要定义同步冲突、幂等、重试、权限和故障恢复。
- 引入第三方 AI、支付、通知或后台任务。
- 团队超过一名持续维护开发人员并需要独立评审架构。

满足其中任意两项后，建议新建 `docs/SYSTEM_DESIGN.md`，重点描述服务边界、数据模型、同步协议、安全、可观测性和失败模式；本技术方案继续保留技术栈、开发命令和阶段规划。

## 核心数据模型

```ts
type TaskStatus = "未开始" | "进行中" | "完成" | "暂时放下";

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  nextStep: string;
  inToday: boolean;
  tagIds: string[];
  repeatMode: "none" | "daily" | "weekdays" | "weekly";
  timeSpentSeconds: number;
  createdAt: string;
  updatedAt: string;
};
```

标签模型支持任意层级：

```ts
type Tag = {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
};

type UserSettings = {
  tagsEnabled: boolean;
  nextStepEnabled: boolean;
  countdownPresets: number[];
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

### Tab 导航与移动端界面

主界面使用三个底部 Tab：快速 Inbox、今日 3 件事、设置。“开始一个小动作”改为任务详情页，由 Inbox 或今日列表的“查看”操作进入，并通过返回按钮退出。Inbox 和今日列表使用独立滚动容器，降低首屏信息负载。

### 循环模式与 Inbox 快捷操作

快速 Inbox 任务卡提供“循环”和可选的“标签”按钮。循环设置通过弹窗选择不循环、每天、工作日或每周，并保存为 `repeatMode`。标签开启后，标签弹窗允许直接修改当前任务的标签集合。

### 倒计时选项

设置中最多保留 3 个倒计时快捷时长，默认是 5、10、15 分钟。用户可以删除并添加 1～180 分钟的整数时长，正计时不受该配置影响。

### 下一步建议开关

设置中的 `nextStepEnabled` 控制建议区域是否显示。关闭后任务仍保留 `nextStep` 数据，用户可以在重新开启后继续使用。

### 可选多层标签

标签功能默认关闭。用户可以在设置页开启、创建任意层级标签，并在任务详情中为当前任务添加多个标签。关闭功能后，标签选择、标签管理和统计均隐藏，但数据保留。

### 标签时间统计

开启标签后，设置页按标签展示执行时间。父标签包含所有后代任务的去重总时间；同一任务同时标记父标签和子标签时，不会在同一分支重复累计。任务跨多个一级标签时，可以出现在多个统计分支中。

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
- 将标签、任务标签关联和个性化设置纳入云端数据模型。
- 使用可幂等的 `task_time_entries` 记录计时会话，并基于标签生成服务端统计。
- 支持云端同步和数据迁移。
- 增加 PWA 离线支持和通知提醒。
- 根据设计系统成熟度评估 Tailwind CSS。

### 暂不做

- 复杂日历。
- 项目管理功能。
- 情绪复盘和自我觉察。
- 统计仪表盘。
- 社交监督和协作功能。
