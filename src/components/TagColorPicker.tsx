import { tagColors, tagColorLabels, type TagColor } from "../domain/tag";

type TagColorPickerProps = {
  value: TagColor;
  onChange: (color: TagColor) => void;
};

export function TagColorPicker({ value, onChange }: TagColorPickerProps) {
  return (
    <div className="tag-color-picker" role="radiogroup" aria-label="标签颜色">
      {tagColors.map((color) => (
        <button
          key={color}
          className={`tag-color-swatch tag-color-${color}${value === color ? " active" : ""}`}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={tagColorLabels[color]}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
}
