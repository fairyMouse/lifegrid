import { buildTask } from "@lifegrid/domain";
import type { Task } from "@lifegrid/types";

const now = "2026-08-01T02:00:00.000Z";

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
  item("t-0728", "整理出境证件", "2026-07-28", { sortOrder: 1 }),
  item("t-0801", "交房租", "2026-08-01", { sortOrder: 1, priority: "high" }),
  item("t-0803", "跑步 5km", "2026-08-03", { sortOrder: 1, status: "completed" }),
  item("t-0805", "买日用品", "2026-08-05", { sortOrder: 1 }),
  item("t-0807", "写周报", "2026-08-07", { sortOrder: 1 }),
  item("t-0810a", "拿快递", "2026-08-10", { sortOrder: 1 }),
  item("t-0810b", "词汇题全部三刷", "2026-08-10", { sortOrder: 2 }),
  item("t-0810c", "处理 APP 问题", "2026-08-10", { sortOrder: 3 }),
  item("t-0810d", "回复租房消息", "2026-08-10", { sortOrder: 4 }),
  item("t-0810e", "收拾行李清单", "2026-08-10", { sortOrder: 5 }),
  item("t-0811", "英语听力", "2026-08-11", { sortOrder: 1 }),
  item("t-0812", "代码 review", "2026-08-12", { sortOrder: 1 }),
  item("t-0814a", "牙医预约", "2026-08-14", { sortOrder: 1 }),
  item("t-0814b", "回邮件", "2026-08-14", { sortOrder: 2 }),
  item("t-0814c", "备份照片", "2026-08-14", { sortOrder: 3 }),
  item("t-0817", "准备签证材料", "2026-08-19", {
    sortOrder: 1,
    startAt: "2026-08-17",
  }),
  item("t-0819", "买七夕礼物", "2026-08-19", { sortOrder: 2 }),
  item("t-0820a", "整理书桌", "2026-08-20", { sortOrder: 1 }),
  item("t-0820b", "更新简历", "2026-08-20", { sortOrder: 2 }),
  item("t-0821", "健身房", "2026-08-21", { sortOrder: 1 }),
  item("t-0824", "完成初版日活动画化", "2026-08-24", { sortOrder: 1 }),
  item("t-0825a", "准备沟通泰国租房", "2026-08-25", { sortOrder: 1 }),
  item("t-0825b", "检查护照有效期", "2026-08-25", { sortOrder: 2 }),
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
  item("t-inbox", "看完那本设计书", null, { sortOrder: 1 }),
];
