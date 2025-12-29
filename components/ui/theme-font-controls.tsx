"use client";

import type { FontCategory, FontOption } from "../../lib/theme/theme-fonts";
import { getCurrentFontSelection } from "../../lib/theme/theme-fonts";
import type { ThemeStyleProps } from "../../lib/types/theme";
import { FontSelector } from "./font-selector";
import { Label } from "./label";

type ThemeFontControlsProps = {
  readonly themeStyles: Partial<ThemeStyleProps>;
  readonly onFontChange: (
    category: FontCategory,
    fontOption: FontOption
  ) => void;
  readonly disabled?: boolean;
};

export function ThemeFontControls({
  themeStyles,
  onFontChange,
  disabled = false,
}: ThemeFontControlsProps) {
  const currentSansFont = getCurrentFontSelection(themeStyles, "sans");
  const currentMonoFont = getCurrentFontSelection(themeStyles, "mono");

  const handleSansFontChange = (fontOption: FontOption): void => {
    onFontChange("sans", fontOption);
  };

  const handleMonoFontChange = (fontOption: FontOption): void => {
    onFontChange("mono", fontOption);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label
          className="mb-2 block font-medium text-base"
          htmlFor="sans-font-selector"
        >
          Sans-serif Font
        </Label>
        <p className="mb-3 text-muted-foreground text-xs">
          Choose the primary font family for text content.
        </p>
        <FontSelector
          aria-label="Select sans-serif font family"
          category="sans"
          disabled={disabled}
          id="sans-font-selector"
          onValueChange={handleSansFontChange}
          value={currentSansFont}
        />
      </div>

      <div>
        <Label
          className="mb-2 block font-medium text-base"
          htmlFor="mono-font-selector"
        >
          Monospace Font
        </Label>
        <p className="mb-3 text-muted-foreground text-xs">
          Choose the font family for code blocks and monospace text.
        </p>
        <FontSelector
          aria-label="Select monospace font family"
          category="mono"
          disabled={disabled}
          id="mono-font-selector"
          onValueChange={handleMonoFontChange}
          value={currentMonoFont}
        />
      </div>
    </div>
  );
}
