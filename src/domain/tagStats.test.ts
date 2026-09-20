import { describe, expect, it } from "vitest";

import { makeTask } from "../test/fixtures";
import type { Tag } from "./tag";
import { buildTagTimeStats } from "./tagStats";

const tags: Tag[] = [
  {
    id: "learning",
    name: "学习",
    parentId: null,
    color: "teal",
    createdAt: "2026-09-20T00:00:00.000Z",
    updatedAt: "2026-09-20T00:00:00.000Z",
  },
  {
    id: "ai",
    name: "AI",
    parentId: "learning",
    color: "teal",
    createdAt: "2026-09-20T00:01:00.000Z",
    updatedAt: "2026-09-20T00:01:00.000Z",
  },
  {
    id: "english",
    name: "英语",
    parentId: "learning",
    color: "teal",
    createdAt: "2026-09-20T00:02:00.000Z",
    updatedAt: "2026-09-20T00:02:00.000Z",
  },
];

describe("tag time statistics", () => {
  it("aggregates child time into parents without double-counting one branch", () => {
    const tasks = [
      makeTask({ id: "ai-task", tagIds: ["ai"], timeSpentSeconds: 120 }),
      makeTask({ id: "english-task", tagIds: ["english"], timeSpentSeconds: 60 }),
      makeTask({ id: "learning-task", tagIds: ["learning"], timeSpentSeconds: 30 }),
    ];

    const stats = buildTagTimeStats(tasks, tags);
    const learning = stats.find((stat) => stat.tag.id === "learning");
    const ai = stats.find((stat) => stat.tag.id === "ai");

    expect(learning).toMatchObject({
      totalSeconds: 210,
      directSeconds: 30,
      taskCount: 3,
    });
    expect(ai).toMatchObject({
      totalSeconds: 120,
      directSeconds: 120,
      taskCount: 1,
    });
  });
});
