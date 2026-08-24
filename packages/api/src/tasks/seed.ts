import { buildTask } from "@lifegrid/domain";
import type { Task } from "@lifegrid/types";

const now = "2026-08-25T02:00:00.000Z";

function item(
  id: string,
  title: string,
  dueAt: string | null,
  extra: Partial<Pick<Task, "sortOrder" | "description" | "status" | "priority" | "startAt">> = {},
): Task {
  return buildTask(
    {
      title,
      dueAt,
      isAllDay: true,
      sortOrder: extra.sortOrder ?? 0,
      description: extra.description,
      status: extra.status,
      priority: extra.priority,
      startAt: extra.startAt,
    },
    new Date(now),
    id,
  );
}

export const SEED_TASKS: Task[] = [
  item("t-0825a", "准备沟通泰国租房", "2026-08-25", { sortOrder: 1 }),
  item("t-0825b", "检查护照有效期", "2026-08-25", { sortOrder: 2 }),
  item("t-0825c", "提前预约换泰铢", "2026-08-25", { sortOrder: 3 }),
  item("t-0826", "确认酒店订单", "2026-08-26", { sortOrder: 1 }),
  item("t-0828", "提交周报", "2026-08-28", { sortOrder: 1 }),
  item("t-0831", "电子入境卡填写", "2026-08-31", {
    sortOrder: 1,
    priority: "high",
  }),
  item("t-0902", "行李补充", "2026-09-02", {
    sortOrder: 1,
    description: "雨伞",
  }),
  item("t-0904", "确认航班", "2026-09-04", { sortOrder: 1 }),
  item("t-0907", "JLPT 截止报名", "2026-09-07", {
    sortOrder: 1,
    priority: "high",
  }),
  item("t-0913", "清迈", "2026-09-13", { sortOrder: 1 }),
  item("t-0919a", "申请数字游民签证", "2026-09-19", { sortOrder: 1 }),
  item("t-0919b", "纯日文看游戏王", "2026-09-19", { sortOrder: 2 }),
  item("t-0927", "约妹妹上海", "2026-09-27", { sortOrder: 1 }),
  item("t-inbox", "看完那本设计书", null, { sortOrder: 1 }),
];
