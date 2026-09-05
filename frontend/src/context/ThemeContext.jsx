import { createContext, useContext, useMemo, useState } from "react";
import {
  applyTheme,
  DARK_THEME,
  LIGHT_THEME,
  readTheme,
} from "../utils/theme";

const ThemeContext = createContext({
  theme: LIGHT_THEME,
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const initial = readTheme();
    applyTheme(initial);
    return initial;
  });

  const value = useMemo(() => {
    const toggleTheme = () => {
      const next = theme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
      applyTheme(next);
      setTheme(next);
    };

    return {
      theme,
      isDark: theme === DARK_THEME,
      toggleTheme,
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
