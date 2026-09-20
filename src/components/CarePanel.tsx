import { useState, type FormEvent } from "react";

import {
  comfortEfforts,
  comfortEffortLabels,
  pickComfortItem,
  type ComfortEffort,
  type ComfortItem,
} from "../domain/comfort";
import type { ComfortSuggestion, ComfortSuggestionProvider } from "../domain/comfortSuggestion";
import type { EnergyState } from "../domain/energy";

type CarePanelProps = {
  items: readonly ComfortItem[];
  energyState: EnergyState | null;
  recentItemIds: readonly string[];
  suggestionProvider: ComfortSuggestionProvider;
  onAdopt: (itemId: string) => void;
  onCreateItem: (title: string, effort: ComfortEffort, howTo?: string) => void;
  onDeleteItem: (itemId: string) => void;
};

export function CarePanel({
  items,
  energyState,
  recentItemIds,
  suggestionProvider,
  onAdopt,
  onCreateItem,
  onDeleteItem,
}: CarePanelProps) {
  const [title, setTitle] = useState("");
  const [effort, setEffort] = useState<ComfortEffort>("medium");
  const [pickedItemId, setPickedItemId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ComfortSuggestion[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const canPick = energyState === "low";
  const pickedItem = items.find((item) => item.id === pickedItemId) ?? null;

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    onCreateItem(trimmedTitle, effort);
    setTitle("");
  }

  function handlePick() {
    const excludeItemIds = [...recentItemIds, ...(pickedItemId ? [pickedItemId] : [])];
    const next =
      pickComfortItem(items, { maxEffort: "low", excludeItemIds }) ??
      pickComfortItem(items, { excludeItemIds });

    setPickedItemId(next?.id ?? null);
  }

  async function handleSuggest() {
    setIsSuggesting(true);

    try {
      const next = await suggestionProvider.suggest({
        energyState,
        existingTitles: items.map((item) => item.title),
      });
      setSuggestions(next);
    } finally {
      setIsSuggesting(false);
    }
  }

  function handleAcceptSuggestion(suggestion: ComfortSuggestion) {
    onCreateItem(suggestion.title, suggestion.effort, suggestion.howTo);
    setSuggestions((current) =>
      current.filter((item) => item.title !== suggestion.title),
    );
  }

  return (
    <section className="care-panel" aria-labelledby="careTitle">
      <div className="section-head">
        <div>
          <p className="eyebrow">Care</p>
          <h2 id="careTitle">照顾自己</h2>
        </div>
        <p className="hint">写下能让自己缓一口气的小事，没电的时候抽一件就好。</p>
      </div>

      <section className="care-pick" aria-labelledby="carePickTitle">
        <div className="mini-head">
          <h3 id="carePickTitle">随机抽一个</h3>
        </div>
        {canPick ? (
          <button
            className="secondary"
            type="button"
            disabled={items.length === 0}
            onClick={handlePick}
          >
            随机抽一个
          </button>
        ) : (
          <p className="care-hint">把今日状态调成「低电量」后，可以随机抽一个。</p>
        )}

        {pickedItem ? (
          <article className="care-picked" aria-live="polite">
            <strong>{pickedItem.title}</strong>
            {pickedItem.howTo ? <span>{pickedItem.howTo}</span> : null}
            <div className="care-picked-actions">
              <button type="button" onClick={() => onAdopt(pickedItem.id)}>
                采纳
              </button>
              <button className="secondary" type="button" onClick={handlePick}>
                换一个
              </button>
            </div>
          </article>
        ) : null}
      </section>

      <section className="care-suggest" aria-labelledby="careSuggestTitle">
        <div className="mini-head">
          <h3 id="careSuggestTitle">AI 生成</h3>
          <button
            className="secondary"
            type="button"
            disabled={isSuggesting}
            onClick={() => void handleSuggest()}
          >
            {suggestions.length > 0 ? "换一批" : "生成候选"}
          </button>
        </div>
        <p className="care-hint">先生成几条候选，觉得合适再放进清单。</p>

        {suggestions.length > 0 ? (
          <div className="care-suggestion-list" aria-live="polite">
            {suggestions.map((suggestion) => (
              <article className="care-suggestion" key={suggestion.title}>
                <div className="comfort-item-main">
                  <span className="comfort-title">{suggestion.title}</span>
                  <span className="comfort-effort">
                    成本 · {comfortEffortLabels[suggestion.effort]}
                  </span>
                  {suggestion.howTo ? (
                    <span className="comfort-how">具体一点：{suggestion.howTo}</span>
                  ) : null}
                </div>
                <button type="button" onClick={() => handleAcceptSuggestion(suggestion)}>
                  加入清单
                </button>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <form className="care-form" onSubmit={handleCreate}>
        <label htmlFor="comfortTitle">新的照顾条目</label>
        <div className="care-form-row">
          <input
            id="comfortTitle"
            type="text"
            autoComplete="off"
            placeholder="例如：喝杯热水"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <select
            aria-label="照顾条目的成本"
            value={effort}
            onChange={(event) => setEffort(event.target.value as ComfortEffort)}
          >
            {comfortEfforts.map((option) => (
              <option key={option} value={option}>
                {comfortEffortLabels[option]}
              </option>
            ))}
          </select>
          <button type="submit">添加条目</button>
        </div>
      </form>

      <div className="comfort-item-list" aria-live="polite">
        {items.length === 0 ? (
          <div className="empty-state">清单还是空的，先写下一条能让自己缓一缓的小事。</div>
        ) : (
          items.map((item) => (
            <article className="comfort-item" key={item.id}>
              <div className="comfort-item-main">
                <span className="comfort-title">{item.title}</span>
                <span className="comfort-effort">成本 · {comfortEffortLabels[item.effort]}</span>
                {item.howTo ? <span className="comfort-how">具体一点：{item.howTo}</span> : null}
              </div>
              <button
                className="secondary"
                type="button"
                aria-label={`删除 ${item.title}`}
                onClick={() => onDeleteItem(item.id)}
              >
                删除
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
