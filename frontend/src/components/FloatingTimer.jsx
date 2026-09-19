import { useEffect, useRef, useState } from "react";
import { useTimer } from "../context/useTimer";
import { formatTimerDisplay } from "../utils/timerUtils";

export default function FloatingTimer() {
  const {
    timeLeft,
    duration,
    isTimerRunning,
    isFloating,
    isMinimized,
    floatingPosition,
    startTimer,
    pauseTimer,
    resetTimer,
    setPresetDuration,
    addFiveMinutes,
    toggleMinimize,
    setIsFloating,
    setFloatingPosition,
  } = useTimer();

  const widgetRef = useRef(null);
  const [pos, setPos] = useState(() => {
    if (floatingPosition) return floatingPosition;
    if (typeof window !== "undefined") {
      return {
        x: Math.max(16, window.innerWidth - 320),
        y: Math.max(80, window.innerHeight - 300),
      };
    }
    return { x: 100, y: 100 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({
    pointerX: 0,
    pointerY: 0,
    startX: 0,
    startY: 0,
  });
  const posRef = useRef(pos);

  // Keep a ref synchronized with current pos to avoid stale closures
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  // Keep within bounds on window resize without triggering re-render loops
  useEffect(() => {
    const handleResize = () => {
      if (!widgetRef.current) return;
      const rect = widgetRef.current.getBoundingClientRect();
      const maxX = Math.max(16, window.innerWidth - rect.width - 16);
      const maxY = Math.max(16, window.innerHeight - rect.height - 16);

      setPos((current) => {
        const clampedX = Math.min(Math.max(16, current.x), maxX);
        const clampedY = Math.min(Math.max(16, current.y), maxY);
        return { x: clampedX, y: clampedY };
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePointerDown = (e) => {
    if (e.button && e.button !== 0) return;
    if (e.target.closest("button") || e.target.closest("input")) return;

    // Prevent mobile browser gestures and pull-to-refresh
    if (e.cancelable) e.preventDefault();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    setIsDragging(true);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: posRef.current.x,
      startY: posRef.current.y,
    };

    const handlePointerMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.pointerX;
      const deltaY = moveEvent.clientY - dragStartRef.current.pointerY;

      const widgetWidth = widgetRef.current?.offsetWidth || 300;
      const widgetHeight = widgetRef.current?.offsetHeight || 180;

      const maxX = Math.max(16, window.innerWidth - widgetWidth - 16);
      const maxY = Math.max(16, window.innerHeight - widgetHeight - 16);

      const nextX = Math.min(
        Math.max(16, dragStartRef.current.startX + deltaX),
        maxX,
      );
      const nextY = Math.min(
        Math.max(16, dragStartRef.current.startY + deltaY),
        maxY,
      );

      setPos({ x: nextX, y: nextY });
    };

    const handlePointerUp = (upEvent) => {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(upEvent.pointerId);
      } catch {
        // ignore
      }

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);

      // Persist only once drag finishes cleanly
      if (typeof setFloatingPosition === "function") {
        setFloatingPosition(posRef.current);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  if (!isFloating) return null;

  const progressPercent =
    duration > 0
      ? Math.min(100, Math.max(0, ((duration - timeLeft) / duration) * 100))
      : 0;

  return (
    <div
      ref={widgetRef}
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
      }}
      className={`fixed z-[9999] select-none touch-none transition-shadow duration-200 ${
        isDragging ? "cursor-grabbing shadow-2xl scale-[1.01]" : "shadow-xl"
      }`}
    >
      {/* ---------------- MINIMIZED PILL MODE ---------------- */}
      {isMinimized ? (
        <div
          onPointerDown={handlePointerDown}
          className="touch-none flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-base-300 bg-base-100/95 backdrop-blur-md cursor-grab active:cursor-grabbing shadow-lg hover:border-primary/50 transition-all"
        >
          <div className="flex items-center gap-0.5 text-base-content/40 hover:text-base-content/70">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 8h16M4 16h16"
              />
            </svg>
          </div>

          <span
            className={`w-2 h-2 rounded-full ${
              isTimerRunning ? "bg-primary animate-pulse" : "bg-base-content/30"
            }`}
          />

          <span className="font-mono text-sm font-bold tracking-tight text-base-content">
            {formatTimerDisplay(timeLeft)}
          </span>

          <button
            type="button"
            onClick={isTimerRunning ? pauseTimer : startTimer}
            className={`btn btn-circle btn-xs ${
              isTimerRunning ? "btn-warning" : "btn-primary"
            }`}
            title={isTimerRunning ? "Pause timer" : "Start timer"}
          >
            {isTimerRunning ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={toggleMinimize}
            className="btn btn-ghost btn-xs btn-circle text-base-content/60 hover:text-base-content"
            title="Expand timer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setIsFloating(false)}
            className="btn btn-ghost btn-xs btn-circle text-base-content/60 hover:text-error"
            title="Dock back to workspace"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ) : (
        /* ---------------- EXPANDED CARD MODE ---------------- */
        <div className="w-72 sm:w-80 rounded-2xl border border-base-300 bg-base-100/95 backdrop-blur-md shadow-2xl overflow-hidden">
          <div
            onPointerDown={handlePointerDown}
            className="touch-none px-4 py-2.5 bg-base-200/80 border-b border-base-300 flex items-center justify-between cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-primary shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/80">
                Focus Timer
              </span>
              <span
                className={`badge badge-xs ${isTimerRunning ? "badge-primary" : "badge-ghost"}`}
              >
                {isTimerRunning ? "Running" : "Paused"}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleMinimize}
                className="btn btn-ghost btn-xs btn-circle text-base-content/60 hover:text-base-content"
                title="Minimize into compact pill"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 12H5"
                  />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => setIsFloating(false)}
                className="btn btn-ghost btn-xs btn-circle text-base-content/60 hover:text-error"
                title="Dock back to workspace"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="w-full bg-base-300 h-1">
            <div
              className="bg-primary h-1 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="p-4 flex flex-col items-center">
            <div className="my-2 font-mono text-4xl sm:text-5xl font-extrabold tracking-tight text-base-content">
              {formatTimerDisplay(timeLeft)}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={isTimerRunning ? pauseTimer : startTimer}
                className={`btn btn-sm px-4 gap-1.5 ${
                  isTimerRunning ? "btn-warning" : "btn-primary"
                }`}
              >
                {isTimerRunning ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Start</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={resetTimer}
                className="btn btn-sm btn-outline"
                title="Reset timer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={addFiveMinutes}
                className="btn btn-sm btn-ghost border border-base-300 text-xs font-semibold"
                title="Add 5 minutes to session"
              >
                +5m
              </button>
            </div>

            <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-base-200 w-full justify-center">
              {[5, 15, 25, 45].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setPresetDuration(mins)}
                  className={`btn btn-xs ${
                    duration === mins * 60 ? "btn-primary" : "btn-ghost"
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>

            <p className="text-[10px] text-base-content/50 mt-2.5 text-center flex items-center gap-1">
              <span>●</span>
              <span>
                Continues counting in other tabs • Drag header to move
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
