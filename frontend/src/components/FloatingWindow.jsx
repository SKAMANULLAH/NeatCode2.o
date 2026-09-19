import { useState, useEffect, useRef, useCallback } from "react";

/**
 * RESIZE_CURSORS
 * CSS cursor mappings for 8-directional resizing
 */
const RESIZE_CURSORS = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
  sw: "nesw-resize",
};

/**
 * FloatingWindow
 * Reusable draggable, 8-directional resizable floating window component with touch-friendly
 * pointer capture, viewport boundary clamping, minimize, maximize, close, dynamic z-index,
 * and LocalStorage persistence.
 * Compatible with mobile, tablet, and PC.
 */
export default function FloatingWindow({
  id,
  title,
  icon,
  isOpen,
  onClose,
  isActive = false,
  onFocus,
  defaultPos,
  storageKey,
  headerExtra,
  children,
  minWidth = 300,
  minHeight = 220,
}) {
  const getInitialPos = () => {
    if (storageKey && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.x === "number" && typeof parsed.y === "number") {
            const screenW = window.innerWidth;
            const screenH = window.innerHeight;
            return {
              x: Math.max(0, Math.min(parsed.x, screenW - 100)),
              y: Math.max(48, Math.min(parsed.y, screenH - 100)),
              width: Math.max(minWidth, Math.min(parsed.width || 480, screenW - 16)),
              height: Math.max(minHeight, Math.min(parsed.height || 560, screenH - 60)),
              isMinimized: Boolean(parsed.isMinimized),
              isMaximized: Boolean(parsed.isMaximized),
            };
          }
        }
      } catch {
        /* ignore */
      }
    }
    return {
      x: defaultPos?.x ?? 20,
      y: defaultPos?.y ?? 60,
      width: defaultPos?.width ?? (typeof window !== "undefined" ? Math.min(500, window.innerWidth - 24) : 480),
      height: defaultPos?.height ?? (typeof window !== "undefined" ? Math.min(600, window.innerHeight - 80) : 560),
      isMinimized: false,
      isMaximized: false,
    };
  };

  const [pos, setPos] = useState(getInitialPos);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [activeResizeDirection, setActiveResizeDirection] = useState(null);

  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, initX: 0, initY: 0 });
  const resizeStartRef = useRef({
    direction: null,
    pointerX: 0,
    pointerY: 0,
    initX: 0,
    initY: 0,
    initW: 0,
    initH: 0,
  });

  // Persist position and dimensions to LocalStorage
  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(pos));
    } catch {
      /* ignore */
    }
  }, [storageKey, pos]);

  // Viewport resize clamping
  useEffect(() => {
    const handleWindowResize = () => {
      setPos((prev) => {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const nextW = Math.min(prev.width, Math.max(minWidth, screenW - 16));
        const nextH = Math.min(prev.height, Math.max(minHeight, screenH - 64));
        const maxX = Math.max(0, screenW - nextW);
        const maxY = Math.max(48, screenH - 60);

        return {
          ...prev,
          width: nextW,
          height: nextH,
          x: Math.min(Math.max(0, prev.x), maxX),
          y: Math.min(Math.max(48, prev.y), maxY),
        };
      });
    };

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [minWidth, minHeight]);

  // Drag handlers using pointer capture
  const handleDragPointerDown = (e) => {
    if (
      e.target.closest("button") ||
      e.target.closest("input") ||
      e.target.closest("select") ||
      e.target.closest(".no-drag")
    ) {
      return;
    }
    e.preventDefault();
    onFocus?.();
    setIsDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      initX: pos.x,
      initY: pos.y,
    };
  };

  const handleDragPointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const maxX = Math.max(0, screenW - pos.width);
    const maxY = Math.max(48, screenH - 50);

    const nextX = Math.min(Math.max(0, dragStartRef.current.initX + dx), maxX);
    const nextY = Math.min(Math.max(48, dragStartRef.current.initY + dy), maxY);

    setPos((prev) => ({
      ...prev,
      x: nextX,
      y: nextY,
    }));
  };

  const handleDragPointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
    }
  };

  // 8-Directional Resize Pointer Down Handler
  const startResize = useCallback(
    (e, direction) => {
      e.preventDefault();
      e.stopPropagation();
      onFocus?.();

      setIsResizing(true);
      setActiveResizeDirection(direction);

      e.currentTarget.setPointerCapture?.(e.pointerId);

      resizeStartRef.current = {
        direction,
        pointerX: e.clientX,
        pointerY: e.clientY,
        initX: pos.x,
        initY: pos.y,
        initW: pos.width,
        initH: pos.height,
      };

      // Set global resize cursor and disable text selection during drag
      const cursor = RESIZE_CURSORS[direction] || "se-resize";
      document.body.style.cursor = cursor;
      document.body.style.userSelect = "none";
    },
    [onFocus, pos.x, pos.y, pos.width, pos.height]
  );

  // Global Pointer Listeners for Seamless 8-Directional Resize
  useEffect(() => {
    if (!isResizing) return;

    const handleWindowPointerMove = (e) => {
      const { direction, pointerX, pointerY, initX, initY, initW, initH } = resizeStartRef.current;
      if (!direction) return;

      const dx = e.clientX - pointerX;
      const dy = e.clientY - pointerY;
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      let nextX = initX;
      let nextY = initY;
      let nextW = initW;
      let nextH = initH;

      // Horizontal Resize (East / West / Right / Left)
      if (direction.includes("e")) {
        // Expand right / narrow right
        const maxW = Math.max(minWidth, screenW - initX - 8);
        nextW = Math.min(Math.max(minWidth, initW + dx), maxW);
      } else if (direction.includes("w")) {
        // Expand left / narrow left
        const maxW = initW + initX; // cannot expand past screen left (x=0)
        const clampedW = Math.min(Math.max(minWidth, initW - dx), maxW);
        nextW = clampedW;
        nextX = initX + (initW - clampedW);
      }

      // Vertical Resize (North / South / Top / Bottom)
      if (direction.includes("s")) {
        // Expand bottom / narrow bottom
        const maxH = Math.max(minHeight, screenH - initY - 12);
        nextH = Math.min(Math.max(minHeight, initH + dy), maxH);
      } else if (direction.includes("n")) {
        // Expand top / narrow top
        const maxH = initH + (initY - 48); // cannot expand past navbar (y=48)
        const clampedH = Math.min(Math.max(minHeight, initH - dy), maxH);
        nextH = clampedH;
        nextY = initY + (initH - clampedH);
      }

      setPos((prev) => ({
        ...prev,
        x: nextX,
        y: nextY,
        width: nextW,
        height: nextH,
      }));
    };

    const handleWindowPointerUp = () => {
      setIsResizing(false);
      setActiveResizeDirection(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, minWidth, minHeight]);

  if (!isOpen) return null;

  return (
    <div
      data-window-id={id}
      onPointerDown={() => onFocus?.()}
      className={`fixed flex flex-col bg-base-100 border border-base-300 shadow-2xl rounded-2xl transition-shadow ${
        isActive ? "z-[96] ring-2 ring-primary/40 shadow-primary/10" : "z-[95]"
      } ${
        pos.isMaximized
          ? "inset-x-2 top-14 bottom-2 w-auto h-auto"
          : "max-sm:inset-x-1"
      }`}
      style={
        !pos.isMaximized
          ? {
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              width: `${pos.width}px`,
              height: pos.isMinimized ? "44px" : `${pos.height}px`,
              minWidth: `${minWidth}px`,
              minHeight: pos.isMinimized ? "44px" : `${minHeight}px`,
            }
          : undefined
      }
    >
      {/* 8-Directional Resize Handles (Hidden when maximized) */}
      {!pos.isMaximized && (
        <>
          {/* Top Edge (Hidden when minimized since minimized window height is fixed) */}
          {!pos.isMinimized && (
            <div
              onPointerDown={(e) => startResize(e, "n")}
              className="absolute -top-1.5 left-4 right-4 h-3 cursor-ns-resize touch-none z-30 group"
              title="Resize Top"
            >
              <div
                className={`w-full h-1 mx-auto mt-1 rounded-full transition-colors ${
                  activeResizeDirection === "n"
                    ? "bg-primary"
                    : "group-hover:bg-primary/50"
                }`}
              />
            </div>
          )}

          {/* Bottom Edge */}
          {!pos.isMinimized && (
            <div
              onPointerDown={(e) => startResize(e, "s")}
              className="absolute -bottom-1.5 left-4 right-4 h-3 cursor-ns-resize touch-none z-30 group"
              title="Resize Bottom"
            >
              <div
                className={`w-full h-1 mx-auto mb-1 rounded-full transition-colors ${
                  activeResizeDirection === "s"
                    ? "bg-primary"
                    : "group-hover:bg-primary/50"
                }`}
              />
            </div>
          )}

          {/* Left Edge (Available in normal and minimized states) */}
          <div
            onPointerDown={(e) => startResize(e, "w")}
            className="absolute -left-1.5 top-3 bottom-3 w-3 cursor-ew-resize touch-none z-30 group"
            title="Resize Left"
          >
            <div
              className={`h-full w-1 my-auto ml-1 rounded-full transition-colors ${
                activeResizeDirection === "w"
                  ? "bg-primary"
                  : "group-hover:bg-primary/50"
              }`}
            />
          </div>

          {/* Right Edge (Available in normal and minimized states) */}
          <div
            onPointerDown={(e) => startResize(e, "e")}
            className="absolute -right-1.5 top-3 bottom-3 w-3 cursor-ew-resize touch-none z-30 group"
            title="Resize Right"
          >
            <div
              className={`h-full w-1 my-auto mr-1 rounded-full transition-colors ${
                activeResizeDirection === "e"
                  ? "bg-primary"
                  : "group-hover:bg-primary/50"
              }`}
            />
          </div>

          {/* Top-Left Corner */}
          {!pos.isMinimized && (
            <div
              onPointerDown={(e) => startResize(e, "nw")}
              className="absolute -top-2 -left-2 w-6 h-6 cursor-nwse-resize touch-none z-30 group flex items-start justify-start p-1"
              title="Resize Top-Left"
            >
              <div
                className={`w-2.5 h-2.5 rounded-tl border-t-2 border-l-2 transition-colors ${
                  activeResizeDirection === "nw"
                    ? "border-primary"
                    : "border-transparent group-hover:border-primary"
                }`}
              />
            </div>
          )}

          {/* Top-Right Corner */}
          {!pos.isMinimized && (
            <div
              onPointerDown={(e) => startResize(e, "ne")}
              className="absolute -top-2 -right-2 w-6 h-6 cursor-nesw-resize touch-none z-30 group flex items-start justify-end p-1"
              title="Resize Top-Right"
            >
              <div
                className={`w-2.5 h-2.5 rounded-tr border-t-2 border-r-2 transition-colors ${
                  activeResizeDirection === "ne"
                    ? "border-primary"
                    : "border-transparent group-hover:border-primary"
                }`}
              />
            </div>
          )}

          {/* Bottom-Left Corner */}
          {!pos.isMinimized && (
            <div
              onPointerDown={(e) => startResize(e, "sw")}
              className="absolute -bottom-2 -left-2 w-6 h-6 cursor-nesw-resize touch-none z-30 group flex items-end justify-start p-1"
              title="Resize Bottom-Left"
            >
              <div
                className={`w-2.5 h-2.5 rounded-bl border-b-2 border-l-2 transition-colors ${
                  activeResizeDirection === "sw"
                    ? "border-primary"
                    : "border-transparent group-hover:border-primary"
                }`}
              />
            </div>
          )}

          {/* Bottom-Right Corner (Includes visible corner grip accent) */}
          {!pos.isMinimized && (
            <div
              onPointerDown={(e) => startResize(e, "se")}
              className="absolute -bottom-2 -right-2 w-6 h-6 cursor-nwse-resize touch-none z-30 group flex items-end justify-end p-1"
              title="Resize Bottom-Right"
            >
              <svg
                viewBox="0 0 16 16"
                className={`w-3.5 h-3.5 transition-colors pointer-events-none ${
                  activeResizeDirection === "se"
                    ? "text-primary"
                    : "text-base-content/40 group-hover:text-primary"
                }`}
                fill="currentColor"
              >
                <path d="M14 14H12V12H14V14ZM14 10H12V8H14V10ZM10 14H8V12H10V14ZM14 6H12V4H14V6ZM10 10H8V8H10V10ZM6 14H4V12H6V14Z" />
              </svg>
            </div>
          )}
        </>
      )}

      {/* Inner Clipped Content Container */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-2xl">
        {/* Header Bar (Grab handle + Title + Extra controls + Window controls) */}
        <div
          onPointerDown={handleDragPointerDown}
          onPointerMove={handleDragPointerMove}
          onPointerUp={handleDragPointerUp}
          onPointerCancel={handleDragPointerUp}
          className="h-[44px] px-3 bg-base-200/90 border-b border-base-300 flex items-center justify-between shrink-0 select-none cursor-grab active:cursor-grabbing backdrop-blur-xs touch-none"
          title="Drag window across workspace"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-base-content/40 text-xs hidden sm:inline" title="Drag handle">
              ⋮⋮
            </span>
            {icon && <span className="shrink-0 flex items-center">{icon}</span>}
            <span className="text-xs font-bold uppercase tracking-wider text-base-content/85 truncate">
              {title}
            </span>
            {headerExtra && (
              <div className="no-drag flex items-center min-w-0 ml-1">
                {headerExtra}
              </div>
            )}
          </div>

          {/* Window action buttons: Minimize, Maximize, Close */}
          <div className="flex items-center gap-1 shrink-0 ml-2 no-drag">
            {/* Minimize / Restore button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPos((prev) => ({ ...prev, isMinimized: !prev.isMinimized }));
              }}
              className="btn btn-ghost btn-xs h-7 w-7 p-0 rounded-md text-base-content/65 hover:text-base-content hover:bg-base-300 flex items-center justify-center text-xs"
              title={pos.isMinimized ? "Expand Window" : "Minimize Window"}
            >
              {pos.isMinimized ? "□" : "—"}
            </button>

            {/* Maximize / Restore button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPos((prev) => ({
                  ...prev,
                  isMaximized: !prev.isMaximized,
                  isMinimized: false,
                }));
              }}
              className="btn btn-ghost btn-xs h-7 w-7 p-0 rounded-md text-base-content/65 hover:text-base-content hover:bg-base-300 flex items-center justify-center text-xs"
              title={pos.isMaximized ? "Restore Window Size" : "Maximize Window"}
            >
              {pos.isMaximized ? "❐" : "🗖"}
            </button>

            {/* Close button */}
            {onClose && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="btn btn-ghost btn-xs h-7 w-7 p-0 rounded-md text-xs font-semibold text-base-content/70 hover:text-error hover:bg-error/15 flex items-center justify-center"
                title={`Close ${title}`}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Window Body (hidden when minimized) */}
        {!pos.isMinimized && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative select-text">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
