import { useState } from "react";

import { repeatModeLabels, repeatModes, type RepeatMode } from "../domain/repeat";
import type { Task } from "../domain/task";

type RepeatModeModalProps = {
  task: Task;
  onSave: (mode: RepeatMode) => void;
  onClose: () => void;
};

export function RepeatModeModal({ task, onSave, onClose }: RepeatModeModalProps) {
  const [mode, setMode] = useState<RepeatMode>(task.repeatMode);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="repeatModeTitle"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mini-head">
          <div>
            <p className="eyebrow">循环设置</p>
            <h3 id="repeatModeTitle">{task.title}</h3>
          </div>
        </div>

        <div className="modal-option-list">
          {repeatModes.map((option) => (
            <label className="modal-option" key={option}>
              <span>{repeatModeLabels[option]}</span>
              <input
                type="radio"
                name="repeat-mode"
                value={option}
                checked={mode === option}
                onChange={() => setMode(option)}
              />
            </label>
          ))}
        </div>

        <div className="modal-actions">
          <button className="secondary" type="button" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(mode);
              onClose();
            }}
          >
            保存
          </button>
        </div>
      </section>
    </div>
  );
}
