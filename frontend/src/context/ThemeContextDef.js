import { createContext } from "react";
import { LIGHT_THEME } from "../utils/theme";

export const ThemeContext = createContext({
  theme: LIGHT_THEME,
  isDark: false,
  toggleTheme: () => {},
});
