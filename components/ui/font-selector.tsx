"use client";

import type { FontCategory, FontOption } from "../../lib/theme/theme-fonts";
import { getFontOptions } from "../../lib/theme/theme-fonts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

type FontSelectorProps = {
  readonly category: FontCategory;
  readonly value: FontOption;
  readonly onValueChange: (fontOption: FontOption) => void;
  readonly disabled?: boolean;
  readonly "aria-label"?: string;
  readonly id?: string;
};

export function FontSelector({
  category,
  value,
  onValueChange,
  disabled = false,
  "aria-label": ariaLabel,
  id,
}: FontSelectorProps) {
  const fontOptions = getFontOptions(category);

  const handleValueChange = (selectedValue: string): void => {
    const selectedFont = fontOptions.find(
      (font) => font.value === selectedValue
    );
    if (selectedFont) {
      onValueChange(selectedFont);
    }
  };

  const getDisplayText = (font: FontOption): string => {
    // Show preview in the actual font for better UX
    return font.label;
  };

  return (
    <Select
      disabled={disabled}
      onValueChange={handleValueChange}
      value={value.value}
    >
      <SelectTrigger
        aria-label={ariaLabel ?? `Select ${category} font`}
        className="w-full"
        id={id}
      >
        <SelectValue>
          <span className="truncate" style={{ fontFamily: value.value }}>
            {getDisplayText(value)}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="z-[80]">
        {fontOptions.map((font) => (
          <SelectItem key={font.label} value={font.value}>
            <span className="truncate" style={{ fontFamily: font.value }}>
              {getDisplayText(font)}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
