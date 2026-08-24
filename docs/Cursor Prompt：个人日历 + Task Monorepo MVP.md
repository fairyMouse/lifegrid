# 项目目标

我要开发一个供自己长期使用的轻量级任务管理应用。

核心参考产品是「滴答清单 / TickTick」，但**不是完整复刻滴答清单**。

第一阶段只解决我最核心的两个需求：

1. **Calendar 日历**
2. **Task 任务**

目标是做到：

- 打开应用即可看到月历
- 每一天直接显示当天的任务
- 点击某一天可以快速创建任务
- 点击任务可以查看 / 编辑详情
- 任务可以设置日期
- 任务可以完成
- 可以拖动任务改变日期
- 日历和任务的数据完全同步
- UI 简洁、快速、适合长期常驻使用
- 后续能够自然扩展到 iOS / Android App

参考我提供的 TickTick 截图理解整体交互和信息密度，但不要机械复制品牌、图标或视觉资产。

---

# 一、项目架构

请使用 **Monorepo**。

推荐：

```text
pnpm
Turborepo
TypeScript
```

项目结构：

```text
personal-calendar/
├── apps/
│   ├── web/                 # Next.js Web，目前主要开发
│   └── mobile/              # Expo React Native，先创建骨架即可
│
├── packages/
│   ├── domain/              # Task / Calendar 核心业务逻辑
│   ├── types/               # 共享 TypeScript 类型
│   ├── api/                 # Supabase / 数据访问层
│   ├── config/              # eslint / tsconfig 等共享配置
│   └── ui/                  # 仅放真正适合 Web + Mobile 共享的内容
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

注意：

不要为了“共享代码”而强行共享所有 UI。

Web 和 React Native 的 Calendar UI 可以独立实现。

真正应该共享的是：

```text
Task 类型
Task 状态
日期计算
重复任务规则
validation
数据访问接口
业务逻辑
```

---

# 二、技术选型

## Web

使用：

```text
Next.js App Router
React
TypeScript
Tailwind CSS
shadcn/ui
lucide-react
```

日历：

```text
FullCalendar
```

需要支持：

```text
dayGridMonth
interaction plugin
drag & drop
event click
date click
```

状态管理尽量轻量。

优先：

```text
React Query / TanStack Query
```

如果暂时没有必要，不要引入 Redux。

---

## Mobile

使用：

```text
Expo
React Native
TypeScript
```

第一阶段：

只初始化 `apps/mobile` 工程。

暂时不用实现完整功能。

但需要确保以后可以直接使用：

```text
@repo/types
@repo/domain
@repo/api
```

不要让 Web 代码和业务逻辑完全绑死。

---

# 三、后端

使用：

```text
Supabase
PostgreSQL
```

原因：

未来 Web / iPhone / Android 都需要同步同一套 Task 数据。

请建立清晰的数据访问层，不要在页面组件中到处直接调用 Supabase。

例如：

```text
packages/api/
  tasks/
    getTasks.ts
    createTask.ts
    updateTask.ts
    deleteTask.ts
```

页面：

```text
UI
 ↓
TanStack Query
 ↓
packages/api
 ↓
Supabase
```

---

# 四、Task 数据模型

第一版 Task 至少包含：

```ts
type Task = {
  id: string

  title: string
  description?: string | null

  status: 'todo' | 'completed'

  priority: 'none' | 'low' | 'medium' | 'high'

  startAt?: string | null
  dueAt?: string | null

  isAllDay: boolean

  completedAt?: string | null

  createdAt: string
  updatedAt: string
}
```

数据库对应建立 `tasks` 表。

建议额外提前保留：

```text
user_id
sort_order
```

即使目前主要是我个人使用，也请让数据库结构未来能够支持账号系统。

---

# 五、当前 MVP 暂时不要做

第一阶段请明确不要实现：

```text
笔记
习惯
番茄钟
AI
团队协作
附件
评论
复杂标签系统
子任务
日历订阅
Google Calendar 同步
通知
桌面客户端
复杂重复规则
```

不要过度设计。

核心目标就是：

> Calendar + Task 做得顺手。

---

# 六、整体页面

桌面端采用类似 TickTick 的布局。

```text
┌──────────┬─────────────────────────────────────────┐
│ Sidebar  │                                         │
│          │                Calendar                 │
│ Today    │                                         │
│ Tasks    │                                         │
│ Calendar │                                         │
│          │                                         │
└──────────┴─────────────────────────────────────────┘
```

第一版 Sidebar 只需要：

```text
Today
Tasks
Calendar
```

默认进入：

```text
/calendar
```

---

# 七、Calendar 页面

这是整个应用目前最重要的页面。

重点做好。

## 顶部栏

类似：

```text
2026年8月

          [+]   [月 ▼]   [<] [今天] [>]
```

功能：

- 显示当前年月
- 上一个月
- 下一个月
- 今天
- 新建任务
- 月视图

第一阶段只做：

```text
Month View
```

但组件结构要允许以后增加：

```text
Week
Day
Agenda
```

---

# 八、月历布局

参考 TickTick。

7 列：

```text
周日
周一
周二
周三
周四
周五
周六
```

每个日期 Cell：

```text
25

任务 A
任务 B
任务 C
+2
```

要求：

- 当天高亮
- 当前选中的日期明显高亮
- 非当前月份日期弱化
- Task 使用紧凑的横条展示
- 一天任务过多时显示 `+N`
- 整体信息密度较高
- 不要做成巨大卡片式 Dashboard

我希望它是一个真正适合看整月安排的 Calendar。

---

# 九、创建 Task

有三种入口：

## 1. 顶部 +

点击：

```text
+
```

打开 Task Editor。

---

## 2. 点击日期空白位置

例如点击：

```text
8月25日
```

新建任务时默认：

```text
dueAt = 2026-08-25
```

---

## 3. 快速输入

最好支持：

在日期 Cell 内出现：

```text
+ 添加任务
```

点击后直接输入 title。

例如：

```text
准备沟通泰国租房
```

按 Enter：

立即创建 Task。

这是非常重要的体验。

---

# 十、Task 显示

Calendar Cell 里面 Task 类似：

```text
准备沟通泰国租房
```

如果完成：

```text
✓ 准备沟通泰国租房
```

并：

```text
opacity 降低
文字划线
```

不要让任务卡片太厚。

应该尽量接近：

```text
height: 24~30px
```

方便一个月展示大量内容。

---

# 十一、Task Detail

点击 Calendar 中的 Task：

打开右侧 Drawer / Floating Panel。

不要跳新页面。

类似：

```text
┌──────────────────────────┐
│ ☐   8月25日              │
│                          │
│ 准备沟通泰国租房         │
│                          │
│ 描述……                   │
│                          │
│ 日期                     │
│ 2026-08-25               │
│                          │
│ 优先级                   │
│ None                     │
│                          │
│                 删除     │
└──────────────────────────┘
```

支持：

- 修改 title
- 修改 description
- 修改日期
- 修改 priority
- 标记完成
- 删除 Task

修改最好自动保存。

避免：

```text
编辑
保存
取消
```

这种传统表单体验。

---

# 十二、拖动 Task

必须实现：

```text
8月25日
Task A
```

直接拖到：

```text
8月27日
```

之后：

```text
Task.dueAt
```

自动更新为：

```text
2026-08-27
```

操作完成后立即反馈。

如果接口失败：

恢复原位置并提示错误。

---

# 十三、Today 页面

第一版保持简单。

显示：

```text
今天 · 8月25日

☐ Task A
☐ Task B
☐ Task C

已完成
☑ Task D
```

支持：

- 完成任务
- 新建任务
- 打开 Task Detail

---

# 十四、Tasks 页面

第一版只需要：

```text
未完成
已完成
```

按照日期排序。

例如：

```text
未完成

今天
☐ Task A
☐ Task B

明天
☐ Task C

8月28日
☐ Task D
```

---

# 十五、视觉风格

整体：

```text
clean
minimal
dark mode first
high information density
desktop productivity app
```

参考：

```text
TickTick
Linear
Raycast
Notion Calendar
```

但不要做得太花。

颜色以：

```text
黑 / 深灰
白 / 浅灰
蓝色 Accent
```

为主。

不要：

```text
大面积渐变
玻璃拟态
夸张阴影
巨大圆角
Dashboard 式巨大 Card
```

我希望看起来像一个真正的桌面生产力工具。

---

# 十六、Dark Mode

第一版优先实现 Dark Mode。

背景建议：

```text
#151515
#1c1c1c
#242424
```

边框尽量轻：

```text
rgba(255,255,255,0.08)
```

Task Accent：

使用低饱和蓝色。

需要保证长期看不会刺眼。

---

# 十七、响应式

第一阶段主要优化：

```text
Mac / Desktop
```

例如：

```text
1280px+
1440px
1600px+
```

但不要写死布局。

小屏幕能够正常缩放。

Mobile Web 暂时不作为主要目标，因为以后会单独开发 Expo App。

---

# 十八、代码组织

请避免：

```text
一个 calendar/page.tsx 写 1000 行
```

拆成：

```text
CalendarPage
CalendarToolbar
MonthCalendar
CalendarTask
TaskEditor
TaskQuickCreate
Sidebar
```

业务逻辑：

```text
hooks/
services/
domain/
```

UI 和数据层分离。

---

# 十九、日期处理

统一使用成熟日期库：

```text
date-fns
```

不要手写大量日期算法。

数据库时间统一：

```text
UTC
```

展示时转换为用户 Local Timezone。

All-day Task 要特别注意不要产生：

```text
UTC 转换导致日期提前 / 延后一天
```

的问题。

---

# 二十、开发顺序

不要一次把所有东西胡乱生成出来。

按照以下顺序执行：

## Phase 1

初始化 Monorepo：

```text
pnpm
Turborepo
apps/web
apps/mobile
packages/*
```

确认：

```text
pnpm dev
```

Web 可以正常启动。

---

## Phase 2

完成静态 UI：

```text
Sidebar
Calendar Toolbar
Month Calendar
Mock Tasks
Task Detail Panel
```

先让我看到完整页面。

使用 Mock Data。

这一阶段不要急着接 Supabase。

---

## Phase 3

实现 Calendar 基础交互：

```text
上一月
下一月
今天
点击日期
点击 Task
Task Detail
```

---

## Phase 4

接入 Supabase：

实现：

```text
getTasks
createTask
updateTask
completeTask
deleteTask
```

---

## Phase 5

实现：

```text
快速创建
拖拽修改日期
Optimistic Update
错误回滚
```

---

## Phase 6

完成：

```text
Today
Tasks
```

---

# 二十一、工程质量

要求：

```text
TypeScript strict
尽量避免 any
ESLint
Prettier
清晰的目录结构
组件职责单一
避免重复逻辑
```

不要创建大量没有实际用途的 abstraction。

保持代码易读。

---

# 二十二、性能目标

这是一个我要长期常驻使用的个人生产力工具。

所以性能非常重要。

目标：

- 页面打开快
- Calendar 切月流畅
- Task 操作即时反馈
- 避免无意义 rerender
- 避免加载巨大 JS 包
- 不要使用 Electron
- Web 端长期运行内存保持合理

未来如果需要桌面 App：

优先考虑：

```text
Tauri
```

不要默认 Electron。

---

# 二十三、未来 App

目前不要开发完整 Mobile App。

但架构必须允许未来：

```text
apps/mobile
```

直接接入 Expo。

未来 App 会实现：

```text
Today
Tasks
Calendar
Task Detail
```

并和 Web 使用同一个 Supabase 数据源。

优先共享：

```text
types
domain logic
validation
API client
```

不要假设 Web Component 可以直接复制到 React Native。

---

# 二十四、未来功能预留

只预留架构，不实现：

```text
Recurring Task
Tags
Notes
Notifications
Search
PWA
Offline
Calendar Sync
AI
Tauri
```

不要因为未来可能需要就提前把 MVP 搞复杂。

---

# 二十五、现在开始执行

请先检查当前目录。

如果当前目录为空：

直接初始化这个 Monorepo。

如果已经存在工程：

先分析现有结构，再决定如何迁移。

第一步只完成：

```text
Phase 1：Monorepo 初始化
+
Phase 2：Calendar 静态 UI
```

使用 Mock Data。

先不要接 Supabase。

最终我要能够执行：

```bash
pnpm install
pnpm dev
```

然后浏览器打开 Web 页面，就能看到一个接近 TickTick 使用体验的：

```text
Sidebar
+
完整 Month Calendar
+
Calendar 中的 Mock Tasks
+
点击 Task 出现右侧 Task Detail
```

请直接修改代码并运行必要的检查。

遇到普通技术决策时自行选择合理方案，不需要每一步都询问我。

完成后告诉我：

1. 创建了哪些目录
2. 核心组件有哪些
3. 如何运行
4. 下一阶段准备做什么
5. 当前有哪些暂时未实现的功能