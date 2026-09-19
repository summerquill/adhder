import { describe, expect, it } from "vitest";

import { makeAlternateNextStep, makeNextStep } from "./nextStep";

describe("next-step suggestions", () => {
  it("returns rule-based suggestions for common task types", () => {
    expect(makeNextStep("整理房间")).toBe("把最显眼的一样东西放回它该在的位置");
    expect(makeNextStep("回复体检预约消息")).toBe("打开对话框，只读一遍最新消息");
    expect(makeNextStep("买洗衣液")).toBe("打开购物 App，先搜索这个物品");
  });

  it("returns a different suggestion when regenerating", () => {
    expect(makeAlternateNextStep("整理房间", "把地上的衣服放进洗衣篮")).toBe(
      "把最显眼的一样东西放回它该在的位置",
    );
    expect(makeAlternateNextStep("准备材料", "把任务写成一个 5 分钟内能开始的动作")).not.toBe(
      "把任务写成一个 5 分钟内能开始的动作",
    );
  });
});
