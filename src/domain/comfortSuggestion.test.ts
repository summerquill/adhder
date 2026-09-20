import { describe, expect, it } from "vitest";

import {
  comfortSuggestionsPerBatch,
  LocalComfortSuggestionProvider,
} from "./comfortSuggestion";

const provider = new LocalComfortSuggestionProvider();

describe("LocalComfortSuggestionProvider", () => {
  it("returns a batch of suggestions", async () => {
    const suggestions = await provider.suggest({ random: () => 0 });

    expect(suggestions).toHaveLength(comfortSuggestionsPerBatch);
    expect(suggestions.every((suggestion) => suggestion.title.length > 0)).toBe(true);
  });

  it("skips comfort items that are already in the list", async () => {
    const suggestions = await provider.suggest({ random: () => 0 });
    const blockedTitles = suggestions.map((suggestion) => suggestion.title);
    const next = await provider.suggest({ existingTitles: blockedTitles, random: () => 0 });

    expect(next).toHaveLength(comfortSuggestionsPerBatch);
    for (const suggestion of next) {
      expect(blockedTitles).not.toContain(suggestion.title);
    }
  });

  it("only offers low-effort items when energy is low", async () => {
    const suggestions = await provider.suggest({ energyState: "low", random: () => 0 });

    expect(suggestions).toHaveLength(comfortSuggestionsPerBatch);
    expect(suggestions.every((suggestion) => suggestion.effort === "low")).toBe(true);
  });

  it("returns an empty batch when nothing new is left", async () => {
    const seen: string[] = [];
    let batch = await provider.suggest({ existingTitles: seen, random: () => 0 });

    while (batch.length > 0) {
      seen.push(...batch.map((suggestion) => suggestion.title));
      batch = await provider.suggest({ existingTitles: seen, random: () => 0 });
    }

    expect(seen.length).toBeGreaterThan(0);
    await expect(provider.suggest({ existingTitles: seen, random: () => 0 })).resolves.toEqual([]);
  });
});
