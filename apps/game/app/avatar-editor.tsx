"use client";
import { appearanceChoices, type Appearance } from "@campuswahala/game-engine";
export function AvatarEditor({
  value,
  onChange,
}: {
  value: Appearance;
  onChange: (a: Appearance) => void;
}) {
  return (
    <fieldset className="avatar-editor">
      <legend>Your look</legend>
      {Object.entries(appearanceChoices).map(([key, values]) => (
        <label key={key}>
          {key === "hairColour"
            ? "Hair colour"
            : key.charAt(0).toUpperCase() + key.slice(1)}
          <select
            value={value[key as keyof Appearance]}
            onChange={(e) => onChange({ ...value, [key]: e.target.value })}
          >
            {values.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      ))}
    </fieldset>
  );
}
