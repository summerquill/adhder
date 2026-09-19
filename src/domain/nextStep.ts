export const stepSuggestions = [
  "把任务写成一个 5 分钟内能开始的动作",
  "打开相关页面或工具，只先看一眼",
  "把需要用到的东西放到手边",
  "先完成最小的一步，不处理后续细节",
] as const;

export function makeNextStep(title: string, fallbackIndex: number | null = null): string {
  if (title.includes("房间") || title.includes("整理")) {
    return "把最显眼的一样东西放回它该在的位置";
  }
  if (title.includes("回复") || title.includes("消息")) {
    return "打开对话框，只读一遍最新消息";
  }
  if (title.includes("买") || title.includes("采购")) {
    return "打开购物 App，先搜索这个物品";
  }

  const index =
    fallbackIndex === null
      ? Math.floor(Math.random() * stepSuggestions.length)
      : ((fallbackIndex % stepSuggestions.length) + stepSuggestions.length) % stepSuggestions.length;

  return stepSuggestions[index];
}

export function makeAlternateNextStep(title: string, currentStep: string): string {
  const ruleSuggestion = makeNextStep(title);
  if (ruleSuggestion !== currentStep) return ruleSuggestion;

  for (const suggestion of stepSuggestions) {
    if (suggestion !== currentStep) return suggestion;
  }

  return ruleSuggestion;
}
