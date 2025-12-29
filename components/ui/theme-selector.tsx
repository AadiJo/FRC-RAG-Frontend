"use client";

import { useEditorStore } from "../../lib/store/editor-store";
import { defaultPresets } from "../../lib/theme/theme-presets";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

type ThemeColorPreviewProps = {
  preset: string;
  mode: "light" | "dark";
};

const ColorBox = ({ color }: { color: string }) => (
  <div
    className="h-3 w-3 rounded-sm border"
    style={{ backgroundColor: color }}
  />
);

function ThemeColorPreview({ preset, mode }: ThemeColorPreviewProps) {
  const presetData = defaultPresets[preset];
  if (!presetData) {
    return null;
  }

  const colors = presetData.styles[mode];

  return (
    <div className="mr-2 flex gap-0.5">
      <ColorBox color={colors.primary || "#000000"} />
      <ColorBox color={colors.accent || "#000000"} />
      <ColorBox color={colors.secondary || "#000000"} />
      <ColorBox color={colors.border || "#000000"} />
    </div>
  );
}

export function ThemeSelector() {
  // Use selector functions to only subscribe to the specific parts of the store we need
  // This prevents unnecessary re-renders when unrelated state changes (e.g., history, future)
  const themeState = useEditorStore((state) => state.themeState);
  const applyThemePreset = useEditorStore((state) => state.applyThemePreset);

  // Use simple string fallback for custom themes
  const selectValue = themeState.preset || "custom";

  // Simple display logic
  const displayText = themeState.preset
    ? defaultPresets[themeState.preset]?.label || themeState.preset
    : "Custom";

  const presetKey = themeState.preset;
  const preset = presetKey ? defaultPresets[presetKey] : undefined;

  return (
    <Select
      onValueChange={(value) => {
        // Only apply if it's an actual preset
        if (value !== "custom" && defaultPresets[value]) {
          applyThemePreset(value);
        }
      }}
      value={selectValue}
    >
      <SelectTrigger className="w-full">
        <SelectValue asChild>
          <div className="flex items-center">
            {presetKey && preset ? (
              <ThemeColorPreview
                mode={themeState.currentMode}
                preset={themeState.preset}
              />
            ) : null}
            <span className="ml-1">{displayText}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="z-[80]">
        {Object.entries(defaultPresets).map(([key, preset]) => (
          <SelectItem key={key} value={key}>
            <div className="flex items-center">
              <ThemeColorPreview mode={themeState.currentMode} preset={key} />
              <span>{preset.label || key}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
