import { energyStateLabels, energyStates, type EnergyState } from "../domain/energy";

type EnergySelectorProps = {
  state: EnergyState | null;
  onChange: (state: EnergyState) => void;
  onOpenCare: () => void;
};

export function EnergySelector({ state, onChange, onOpenCare }: EnergySelectorProps) {
  return (
    <div className="energy-row">
      <div className="energy-options" role="group" aria-label="今日状态">
        {energyStates.map((option) => (
          <button
            key={option}
            className={`energy-option energy-${option}${state === option ? " active" : ""}`}
            type="button"
            aria-pressed={state === option}
            onClick={() => onChange(option)}
          >
            <span className="energy-dot" aria-hidden="true" />
            <span>{energyStateLabels[option]}</span>
          </button>
        ))}
      </div>
      <button className="secondary care-entry" type="button" onClick={onOpenCare}>
        照顾自己
      </button>
    </div>
  );
}
