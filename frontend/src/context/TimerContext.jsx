import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import { formatTimerDisplay, playChime } from "../utils/timerUtils";
import { TimerContext } from "./TimerContextDef";

const STORAGE_KEY = "neatcode_timer_v2";
const DEFAULT_DURATION = 25 * 60; // 25 minutes default

export function TimerProvider({ children }) {
  const [timerState, setTimerState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const now = Date.now();

        if (parsed.isTimerRunning && parsed.endTime) {
          const remaining = Math.max(
            0,
            Math.ceil((parsed.endTime - now) / 1000),
          );
          if (remaining > 0) {
            return {
              ...parsed,
              timeLeft: remaining,
              isTimerRunning: true,
            };
          }
          // Ended while page was closed
          return {
            ...parsed,
            timeLeft: 0,
            isTimerRunning: false,
            endTime: null,
          };
        }

        return {
          ...parsed,
          isTimerRunning: false,
          endTime: null,
          timeLeft: parsed.timeLeft ?? DEFAULT_DURATION,
          duration: parsed.duration ?? DEFAULT_DURATION,
        };
      }
    } catch (e) {
      console.error("Failed to load timer state:", e);
    }

    return {
      duration: DEFAULT_DURATION,
      timeLeft: DEFAULT_DURATION,
      isTimerRunning: false,
      endTime: null,
      isFloating: false,
      isMinimized: false,
      floatingPosition: null, // default handled in component
    };
  });

  const intervalRef = useRef(null);
  const originalTitleRef = useRef(
    typeof document !== "undefined" ? document.title : "NeatCode",
  );

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(timerState));
    } catch (e) {
      console.warn("Error saving timer state:", e);
    }
  }, [timerState]);

  const onTimerComplete = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      timeLeft: 0,
      isTimerRunning: false,
      endTime: null,
    }));

    playChime();
    toast.success("Focus session completed! Great job! 🎉", {
      duration: 6000,
      icon: "⏰",
    });

    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification("NeatCode Focus Timer", {
          body: "Focus session completed! Take a short break.",
          icon: "/favicon.svg",
        });
      } catch (err) {
        console.warn("Notification error:", err);
      }
    }
  }, []);

  // Recalculate remaining seconds from endTime
  const syncWithWallClock = useCallback(() => {
    setTimerState((prev) => {
      if (!prev.isTimerRunning || !prev.endTime) return prev;

      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((prev.endTime - now) / 1000));

      if (remaining <= 0) {
        setTimeout(onTimerComplete, 0);
        return {
          ...prev,
          timeLeft: 0,
          isTimerRunning: false,
          endTime: null,
        };
      }

      return {
        ...prev,
        timeLeft: remaining,
      };
    });
  }, [onTimerComplete]);

  // Interval loop & visibilitychange handling
  useEffect(() => {
    if (!timerState.isTimerRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Run tick every 250ms for responsive time synchronization
    intervalRef.current = setInterval(syncWithWallClock, 250);

    // When returning from another browser tab, immediately recalculate
    const handleVisibilityOrFocus = () => {
      syncWithWallClock();
    };

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
    };
  }, [timerState.isTimerRunning, syncWithWallClock]);

  // Update browser tab title with countdown so user sees it in other tabs
  useEffect(() => {
    if (typeof document === "undefined") return;
    const defaultTitle = originalTitleRef.current || "NeatCode";

    if (timerState.isTimerRunning && timerState.timeLeft > 0) {
      document.title = `(${formatTimerDisplay(timerState.timeLeft)}) Focus • NeatCode`;
    } else {
      document.title = defaultTitle;
    }

    return () => {
      document.title = defaultTitle;
    };
  }, [timerState.isTimerRunning, timerState.timeLeft]);

  // Actions
  const startTimer = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch(() => {});
    }

    setTimerState((prev) => {
      const currentRemaining =
        prev.timeLeft <= 0 ? prev.duration : prev.timeLeft;
      const targetEndTime = Date.now() + currentRemaining * 1000;

      return {
        ...prev,
        timeLeft: currentRemaining,
        isTimerRunning: true,
        endTime: targetEndTime,
      };
    });
  }, []);

  const pauseTimer = useCallback(() => {
    setTimerState((prev) => {
      const now = Date.now();
      const remaining = prev.endTime
        ? Math.max(0, Math.ceil((prev.endTime - now) / 1000))
        : prev.timeLeft;

      return {
        ...prev,
        isTimerRunning: false,
        endTime: null,
        timeLeft: remaining,
      };
    });
  }, []);

  const resetTimer = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      isTimerRunning: false,
      endTime: null,
      timeLeft: prev.duration,
    }));
  }, []);

  const setPresetDuration = useCallback((durationInMinutes) => {
    const seconds = durationInMinutes * 60;
    setTimerState((prev) => ({
      ...prev,
      duration: seconds,
      timeLeft: seconds,
      isTimerRunning: false,
      endTime: null,
    }));
  }, []);

  const addFiveMinutes = useCallback(() => {
    setTimerState((prev) => {
      const added = 5 * 60;
      const newTime = prev.timeLeft + added;
      const newDuration = prev.duration + added;
      const newEndTime = prev.isTimerRunning && prev.endTime
        ? prev.endTime + added * 1000
        : null;

      return {
        ...prev,
        timeLeft: newTime,
        duration: newDuration,
        endTime: newEndTime,
      };
    });
    toast.success("+5 Minutes added");
  }, []);

  const toggleFloating = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      isFloating: !prev.isFloating,
    }));
  }, []);

  const setIsFloating = useCallback((floating) => {
    setTimerState((prev) => ({
      ...prev,
      isFloating: Boolean(floating),
    }));
  }, []);

  const toggleMinimize = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      isMinimized: !prev.isMinimized,
    }));
  }, []);

  const setFloatingPosition = useCallback((position) => {
    setTimerState((prev) => ({
      ...prev,
      floatingPosition: position,
    }));
  }, []);

  const value = useMemo(
    () => ({
      timeLeft: timerState.timeLeft,
      duration: timerState.duration,
      isTimerRunning: timerState.isTimerRunning,
      isFloating: timerState.isFloating,
      isMinimized: timerState.isMinimized,
      floatingPosition: timerState.floatingPosition,
      startTimer,
      pauseTimer,
      resetTimer,
      setPresetDuration,
      addFiveMinutes,
      toggleFloating,
      setIsFloating,
      toggleMinimize,
      setFloatingPosition,
    }),
    [
      timerState.timeLeft,
      timerState.duration,
      timerState.isTimerRunning,
      timerState.isFloating,
      timerState.isMinimized,
      timerState.floatingPosition,
      startTimer,
      pauseTimer,
      resetTimer,
      setPresetDuration,
      addFiveMinutes,
      toggleFloating,
      setIsFloating,
      toggleMinimize,
      setFloatingPosition,
    ],
  );

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  );
}
