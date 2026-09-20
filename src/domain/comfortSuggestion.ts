import type { ComfortEffort } from "./comfort";
import type { EnergyState } from "./energy";

export type ComfortSuggestion = {
  title: string;
  effort: ComfortEffort;
  howTo?: string;
};

export type ComfortSuggestionContext = {
  energyState?: EnergyState | null;
  existingTitles?: readonly string[];
  random?: () => number;
};

export interface ComfortSuggestionProvider {
  suggest(context?: ComfortSuggestionContext): Promise<ComfortSuggestion[]>;
}

export const comfortSuggestionsPerBatch = 3;

const comfortSuggestionTemplates: ComfortSuggestion[] = [
  { title: "喝一杯温水", effort: "low", howTo: "慢慢喝完，不用顺便做别的事" },
  { title: "把肩膀放松下来", effort: "low", howTo: "吸气时耸起肩膀，呼气时放下，做三次" },
  { title: "到窗边待两分钟", effort: "low", howTo: "看看远处的树或天空，不刷手机" },
  { title: "听一首喜欢的歌", effort: "low", howTo: "只听歌，别同时做别的" },
  { title: "把毯子拉到肩膀上", effort: "low" },
  { title: "闭上眼睛数五个呼吸", effort: "low", howTo: "数不到五个也没关系" },
  { title: "洗把脸", effort: "low", howTo: "让水凉一点，注意水温就好" },
  { title: "把手机放到够不着的地方", effort: "low", howTo: "十分钟就够" },
  { title: "吃点不用准备的东西", effort: "low", howTo: "手边有什么就吃什么" },
  { title: "给信任的人发一句话", effort: "medium", howTo: "不用解释清楚，说一句就够" },
  { title: "出门走十分钟", effort: "high", howTo: "不用换衣服，走到楼下也算" },
  { title: "洗个热水澡", effort: "high" },
];

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = result[index] as T;
    result[index] = result[swapIndex] as T;
    result[swapIndex] = current;
  }

  return result;
}

export class LocalComfortSuggestionProvider implements ComfortSuggestionProvider {
  async suggest(context: ComfortSuggestionContext = {}): Promise<ComfortSuggestion[]> {
    const random = context.random ?? Math.random;
    const existingTitles = new Set(
      (context.existingTitles ?? []).map((title) => title.trim()).filter(Boolean),
    );
    const lowEnergyOnly = context.energyState === "low";
    const pool = comfortSuggestionTemplates.filter(
      (suggestion) =>
        !existingTitles.has(suggestion.title) && (!lowEnergyOnly || suggestion.effort === "low"),
    );

    return shuffle(pool, random).slice(0, comfortSuggestionsPerBatch);
  }
}
