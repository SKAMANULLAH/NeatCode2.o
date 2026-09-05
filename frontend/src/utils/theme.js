export const LIGHT_THEME = "neatlight";
export const DARK_THEME = "neatdark";
export const THEME_STORAGE_KEY = "neatcode-theme";

export const readTheme = () => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === LIGHT_THEME || stored === DARK_THEME) {
      return stored;
    }
  } catch {
    // ignore storage errors
  }

  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return DARK_THEME;
  }

  return LIGHT_THEME;
};

export const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore storage errors
  }
};
