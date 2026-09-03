"use client";

import type React from "react";

import { cn } from "@/lib/cn";

import { Monitor, Moon, Sun } from "lucide-react";
import { ThemeProvider, useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribeToHydration = () => () => {};

function useHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
}

export const AppThemeSwitcher = () => {
  const mounted = useHydrated();
  const { theme, setTheme } = useTheme();

  if (!mounted) {
    return (
      <span
        aria-hidden="true"
        data-theme-placeholder=""
        className="flex h-7 w-20 rounded-medium bg-bg-subtle p-0.5"
      />
    );
  }

  const buttons = [
    {
      label: "system",
      icon: <Monitor width={13} />,
      active: theme === "system",
    },
    { label: "dark", icon: <Moon width={13} />, active: theme === "dark" },
    { label: "light", icon: <Sun width={13} />, active: theme === "light" },
  ];

  return (
    <span
      aria-label="Theme"
      className="flex w-20 items-center justify-center gap-0.5 overflow-hidden rounded-medium bg-bg-subtle p-0.5"
      role="group"
    >
      {buttons.map(({ label, icon, active }) => (
        <button
          type="button"
          key={label}
          onClick={() => setTheme(label)}
          aria-label={`Use ${label} theme`}
          aria-pressed={active}
          className={cn(
            "transition-colors flex h-6 w-6 items-center justify-center rounded-small",
            active ? "bg-bg-elevated text-fg" : "text-fg-muted hover:text-fg",
          )}
        >
          {icon}
        </button>
      ))}
    </span>
  );
};

export const AppThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <ThemeProvider
      enableSystem={true}
      attribute="class"
      storageKey="theme"
      defaultTheme="system"
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
};
