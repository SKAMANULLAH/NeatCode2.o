import { useContext } from "react";
import { TimerContext } from "./TimerContextDef";

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
};
