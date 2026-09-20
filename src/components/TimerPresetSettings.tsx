import { useState, type FormEvent } from "react";

type TimerPresetSettingsProps = {
  presets: readonly number[];
  onChange: (presets: number[]) => void;
};

export function TimerPresetSettings({ presets, onChange }: TimerPresetSettingsProps) {
  const [minutes, setMinutes] = useState("");
  const [error, setError] = useState("");

  function addPreset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(minutes);

    if (!Number.isInteger(value) || value < 1 || value > 180) {
      setError("请输入 1～180 之间的整数分钟。");
      return;
    }
    if (presets.includes(value)) {
      setError("这个时长已经存在。");
      return;
    }
    if (presets.length >= 3) {
      setError("最多保留 3 个倒计时选项。");
      return;
    }

    onChange([...presets, value].sort((left, right) => left - right));
    setMinutes("");
    setError("");
  }

  function removePreset(value: number) {
    if (presets.length <= 1) return;
    onChange(presets.filter((preset) => preset !== value));
  }

  return (
    <section className="settings-card" aria-labelledby="timerPresetTitle">
      <div className="mini-head">
        <div>
          <h3 id="timerPresetTitle">倒计时选项</h3>
          <p className="settings-hint">最多保留 3 个常用时长，可以自定义。</p>
        </div>
      </div>

      <div className="timer-preset-list">
        {presets.map((preset) => (
          <span className="timer-preset-chip" key={preset}>
            {preset} 分钟
            <button
              type="button"
              aria-label={`删除 ${preset} 分钟选项`}
              disabled={presets.length <= 1}
              onClick={() => removePreset(preset)}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <form className="timer-preset-form" onSubmit={addPreset}>
        <input
          aria-label="自定义倒计时分钟数"
          type="number"
          min="1"
          max="180"
          inputMode="numeric"
          placeholder="例如：25"
          value={minutes}
          onChange={(event) => setMinutes(event.target.value)}
        />
        <button type="submit" disabled={presets.length >= 3}>
          添加时长
        </button>
      </form>
      {error ? <p className="form-error">{error}</p> : null}
    </section>
  );
}
