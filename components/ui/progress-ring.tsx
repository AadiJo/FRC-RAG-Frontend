import React from "react";
import { cn } from "@/lib/utils";

type ProgressRingProps = {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
  label?: string;
  color?: "primary" | "warning" | "success" | "danger";
};

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  max,
  size = 48,
  strokeWidth = 4,
  className,
  showLabel = true,
  label,
  color = "primary",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(value / max, 1);
  const strokeDasharray = `${progress * circumference}, ${circumference}`;
  const percentage = Math.round(progress * 100);

  const colorClasses = {
    primary: "stroke-primary",
    warning: "stroke-orange-500",
    success: "stroke-green-500",
    danger: "stroke-red-500",
  };

  // Generate unique IDs for accessibility
  const labelId = React.useId();
  const describedById = label ? `${labelId}-desc` : undefined;

  return (
    <div
      aria-describedby={describedById}
      aria-label={label || `Progress: ${percentage}% complete`}
      aria-valuemax={max}
      aria-valuemin={0}
      aria-valuenow={value}
      className={cn("relative flex items-center justify-center", className)}
      role="progressbar"
    >
      <svg
        className="-rotate-90 transform"
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        width={size}
      >
        <title>{label || `Progress ring: ${percentage}%`}</title>
        {/* Background circle */}
        <circle
          className="stroke-muted"
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          className={cn(
            colorClasses[color],
            "transition-all duration-300 ease-in-out [transition-property:stroke-dasharray,stroke]"
          )}
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          r={radius}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />
      </svg>
      {showLabel ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-semibold text-foreground text-xs" id={labelId}>
            {value}/{max}
          </span>
          {label ? (
            <span
              className="text-[10px] text-muted-foreground leading-none"
              id={describedById}
            >
              {label}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
