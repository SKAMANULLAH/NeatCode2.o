import { useContext } from "react";
import { ThemeContext } from "./ThemeContextDef";

export const useTheme = () => useContext(ThemeContext);
