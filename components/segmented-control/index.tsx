"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type SegmentedOption = {
  value: string;
  /** Accessible name for the segment, e.g. "Use dark theme". */
  label: string;
  icon?: ReactNode;
};

interface SegmentedControlProps {
  label: string;
  options: readonly SegmentedOption[];
  value: string;
  onSelect: (value: string) => void;
}

const trackClasses =
  "flex items-center gap-0.5 rounded-medium bg-bg-subtle p-0.5";

const buttonClasses = (active: boolean) =>
  cn(
    "flex size-6 items-center justify-center rounded-small transition-colors",
    active ? "bg-bg-elevated text-fg" : "text-fg-muted hover:text-fg",
  );

/**
 * A segmented control sized by its content. The track uses the subtle surface
 * role and the active segment the elevated surface role.
 */
export const SegmentedControl = ({
  label,
  options,
  value,
  onSelect,
}: SegmentedControlProps) => {
  return (
    <span role="group" aria-label={label} className={trackClasses}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-label={option.label}
            aria-pressed={active}
            onClick={() => onSelect(option.value)}
            className={buttonClasses(active)}
          >
            {option.icon}
          </button>
        );
      })}
    </span>
  );
};

/**
 * The pre-hydration placeholder. It mirrors the segmented control's track and
 * segment dimensions (via invisible segments) so the reserved footprint before
 * hydration matches the hydrated control exactly.
 */
export const SegmentedControlPlaceholder = ({
  options,
}: {
  options: readonly SegmentedOption[];
}) => {
  return (
    <span aria-hidden="true" data-theme-placeholder="" className={trackClasses}>
      {options.map((option) => (
        <span
          key={option.value}
          aria-hidden="true"
          className="invisible flex size-6 items-center justify-center"
        >
          {option.icon}
        </span>
      ))}
    </span>
  );
};
