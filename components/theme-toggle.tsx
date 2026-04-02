"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-zinc-800">
        <Sun className="h-5 w-5 text-gray-600 dark:text-zinc-400" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
      title="Toggle theme (Press D)"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-zinc-400" />
      ) : (
        <Moon className="h-5 w-5 text-gray-600" />
      )}
    </button>
  );
}
