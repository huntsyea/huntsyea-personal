"use client";

import type { SegmentedOption } from "@/components/segmented-control";
import type React from "react";

import {
  SegmentedControl,
  SegmentedControlPlaceholder,
} from "@/components/segmented-control";

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

const themeOptions: readonly SegmentedOption[] = [
  { value: "system", label: "Use system theme", icon: <Monitor width={13} /> },
  { value: "dark", label: "Use dark theme", icon: <Moon width={13} /> },
  { value: "light", label: "Use light theme", icon: <Sun width={13} /> },
];

export const AppThemeSwitcher = () => {
  const mounted = useHydrated();
  const { theme, setTheme } = useTheme();

  if (!mounted) {
    return <SegmentedControlPlaceholder options={themeOptions} />;
  }

  return (
    <SegmentedControl
      label="Theme"
      value={theme ?? "system"}
      options={themeOptions}
      onSelect={(selected) => setTheme(selected)}
    />
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
