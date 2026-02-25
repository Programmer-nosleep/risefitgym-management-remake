import { getLocalStorageItem, setLocalStorageItem } from "@/lib/localstorage"
import { ThemeContext, type ThemeContextValue, type Theme } from "@/hooks/use-theme"
import * as React from "react"

const STORAGE_KEY = "risefit-theme"

function resolveInitialTheme(): Theme {
  const stored = getLocalStorageItem(STORAGE_KEY)
  if (stored === "light" || stored === "dark") return stored

  if (typeof window === "undefined") return "light"
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle("dark", theme === "dark")
  root.style.colorScheme = theme
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(() => resolveInitialTheme())

  const setTheme = React.useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme)
    setLocalStorageItem(STORAGE_KEY, nextTheme)
  }, [])

  const toggleTheme = React.useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark")
  }, [setTheme, theme])

  React.useLayoutEffect(() => {
    applyTheme(theme)
  }, [theme])

  React.useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return
      if (event.newValue !== "light" && event.newValue !== "dark") return
      setThemeState(event.newValue)
    }

    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
