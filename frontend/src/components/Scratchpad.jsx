import { useState, useEffect, useRef, useCallback } from "react";

const COLOR_PALETTE = [
  { label: "Default", value: "DEFAULT" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Green", value: "#10b981" },
  { label: "Red", value: "#ef4444" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Purple", value: "#8b5cf6" },
];

const STROKE_WIDTHS = [
  { label: "Fine", size: 2 },
  { label: "Normal", size: 4 },
  { label: "Bold", size: 8 },
  { label: "Marker", size: 16 },
];

const Scratchpad = ({ problemId, isDark, onClose }) => {
  const [activeTab, setActiveTab] = useState("board"); // 'board' | 'notes'
  const [tool, setTool] = useState("pen"); // 'pen' | 'eraser'
  const [color, setColor] = useState("DEFAULT");
  const [customColor, setCustomColor] = useState("#3b82f6");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [notes, setNotes] = useState(() => {
    try {
      const raw = localStorage.getItem(`scratchpad-problem-${problemId}`);
      if (raw) {
        return JSON.parse(raw)?.notes || "";
      }
    } catch {
      // safe fallback
    }
    return "";
  });
  const [prevProblemId, setPrevProblemId] = useState(problemId);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [savedStatus, setSavedStatus] = useState("Synced");

  if (prevProblemId !== problemId) {
    setPrevProblemId(problemId);
    let loadedNotes = "";
    try {
      const raw = localStorage.getItem(`scratchpad-problem-${problemId}`);
      if (raw) {
        loadedNotes = JSON.parse(raw)?.notes || "";
      }
    } catch {
      // safe fallback
    }
    setNotes(loadedNotes);
    setCanUndo(false);
    setCanRedo(false);
  }

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const historyRef = useRef([]);
  const redoStackRef = useRef([]);
  const saveTimeoutRef = useRef(null);

  // Storage key for current problem
  const storageKey = `scratchpad-problem-${problemId}`;

  // Helper to determine the actual pen stroke color based on theme
  const getActiveStrokeColor = useCallback(() => {
    if (tool === "eraser") return "transparent";
    if (color === "DEFAULT") {
      return isDark ? "#f3f4f6" : "#1f2937";
    }
    return color === "CUSTOM" ? customColor : color;
  }, [tool, color, customColor, isDark]);

  // Save current state to localStorage
  const persistState = useCallback(
    (customCanvas = null, customNotes = null) => {
      if (!problemId) return;

      const canvas = customCanvas || canvasRef.current;
      const textNotes = customNotes !== null ? customNotes : notes;
      const canvasData = canvas ? canvas.toDataURL("image/png") : "";

      try {
        const payload = {
          canvasData,
          notes: textNotes,
          updatedAt: Date.now(),
        };
        localStorage.setItem(storageKey, JSON.stringify(payload));
        setSavedStatus("Saved");
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          setSavedStatus("Synced");
        }, 1500);
      } catch (err) {
        console.warn("Scratchpad storage error:", err);
      }
    },
    [problemId, storageKey, notes],
  );

  // Snapshot canvas to undo stack
  const snapshotHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL("image/png");
      historyRef.current.push(dataUrl);
      if (historyRef.current.length > 25) {
        historyRef.current.shift();
      }
      redoStackRef.current = [];
      setCanUndo(historyRef.current.length > 0);
      setCanRedo(false);
    } catch {
      // Ignore security/size errors
    }
  }, []);

  // Restore canvas from image data URL
  const restoreCanvasFromDataUrl = useCallback((dataUrl, callback) => {
    const canvas = canvasRef.current;
    if (!canvas || !dataUrl) return;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      if (callback) callback();
    };
    img.src = dataUrl;
  }, []);

  // Load canvas image from localStorage on problemId change
  useEffect(() => {
    if (!problemId) return;

    let savedCanvasData = null;
    try {
      const raw = localStorage.getItem(`scratchpad-problem-${problemId}`);
      if (raw) {
        savedCanvasData = JSON.parse(raw)?.canvasData;
      }
    } catch (e) {
      console.warn("Failed to load scratchpad for problem:", e);
    }

    historyRef.current = [];
    redoStackRef.current = [];

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (savedCanvasData) {
        restoreCanvasFromDataUrl(savedCanvasData);
      }
    }
  }, [problemId, restoreCanvasFromDataUrl]);

  // Adjust canvas size to container dimensions without losing existing drawing
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width <= 0 || height <= 0) return;

        const currentWidth = canvas.width;
        const currentHeight = canvas.height;

        // If dimensions haven't significantly changed, skip
        if (Math.abs(currentWidth - width) < 2 && Math.abs(currentHeight - height) < 2) {
          return;
        }

        // Save current canvas content before changing dimensions
        const prevDataUrl = canvas.toDataURL("image/png");

        canvas.width = Math.floor(width);
        canvas.height = Math.floor(height);

        // Restore image into resized canvas
        if (prevDataUrl && prevDataUrl.length > 50) {
          const img = new Image();
          img.onload = () => {
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
          };
          img.src = prevDataUrl;
        }
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Pointer event handlers for drawing
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e) => {
    if (activeTab !== "board") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    e.preventDefault();
    canvas.setPointerCapture?.(e.pointerId);

    // Save snapshot for undo before new stroke begins
    snapshotHistory();

    isDrawingRef.current = true;
    const coords = getCoordinates(e);
    lastPointRef.current = coords;

    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = strokeWidth * 3.5;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = getActiveStrokeColor();
      ctx.lineWidth = strokeWidth;
    }

    // Draw single dot on click
    ctx.arc(coords.x, coords.y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === "eraser" ? "rgba(0,0,0,1)" : getActiveStrokeColor();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const handlePointerMove = (e) => {
    if (!isDrawingRef.current || activeTab !== "board") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    e.preventDefault();
    const coords = getCoordinates(e);
    const ctx = canvas.getContext("2d");

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastPointRef.current = coords;
  };

  const handlePointerUp = (e) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.closePath();
      try {
        canvas.releasePointerCapture?.(e.pointerId);
      } catch {
        // Safe ignore
      }
    }

    persistState();
  };

  // Undo stroke
  const handleUndo = () => {
    if (historyRef.current.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const currentSnapshot = canvas.toDataURL("image/png");
    redoStackRef.current.push(currentSnapshot);
    setCanRedo(true);

    const previousSnapshot = historyRef.current.pop();
    setCanUndo(historyRef.current.length > 0);

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (previousSnapshot) {
      restoreCanvasFromDataUrl(previousSnapshot, () => {
        persistState();
      });
    } else {
      persistState();
    }
  };

  // Redo stroke
  const handleRedo = () => {
    if (redoStackRef.current.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const nextSnapshot = redoStackRef.current.pop();
    setCanRedo(redoStackRef.current.length > 0);

    const currentSnapshot = canvas.toDataURL("image/png");
    historyRef.current.push(currentSnapshot);
    setCanUndo(true);

    restoreCanvasFromDataUrl(nextSnapshot, () => {
      persistState();
    });
  };

  // Clear Canvas
  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    snapshotHistory();
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    persistState();
  };

  // Download whiteboard image
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create export canvas with solid background so saved PNG isn't transparent
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext("2d");

    // Fill background
    ctx.fillStyle = isDark ? "#1d232a" : "#ffffff";
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(canvas, 0, 0);

    const link = document.createElement("a");
    link.download = `scratchpad-${problemId || "board"}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  };

  // Notes change handler
  const handleNotesChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    persistState(null, val);
  };

  return (
    <div className="flex flex-col h-full w-full bg-base-100 overflow-hidden">
      {/* Top Header / Mode Switcher */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-base-300 bg-base-200/70 shrink-0 gap-2 select-none">
        {/* Board / Notes Tab Switcher */}
        <div className="inline-flex p-0.5 rounded-lg bg-base-300/60 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("board")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "board"
                ? "bg-base-100 text-base-content shadow-xs"
                : "text-base-content/60 hover:text-base-content"
            }`}
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
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            <span>Canvas</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "notes"
                ? "bg-base-100 text-base-content shadow-xs"
                : "text-base-content/60 hover:text-base-content"
            }`}
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Notes</span>
          </button>
        </div>

        {/* Right header actions: Status & Export */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-medium text-base-content/40 tracking-tight hidden sm:inline">
            {savedStatus}
          </span>

          {activeTab === "board" && (
            <button
              type="button"
              onClick={handleDownload}
              className="btn btn-ghost btn-xs h-7 px-1.5 rounded-md border border-base-300 text-base-content/70 hover:text-base-content"
              title="Export Scratchpad Image"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-xs h-7 px-1.5 rounded-md text-base-content/60 hover:text-base-content"
              title="Close Scratchpad"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "board" ? (
        <div className="flex flex-col flex-1 min-h-0 relative">
          {/* Drawing Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-1.5 border-b border-base-300 bg-base-100/90 shrink-0 text-xs">
            {/* Tool Selection: Pen vs Eraser */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setTool("pen")}
                className={`btn btn-xs h-7 px-2 rounded-md font-medium border flex items-center gap-1 ${
                  tool === "pen"
                    ? "bg-primary text-primary-content border-primary"
                    : "bg-base-100 text-base-content/70 border-base-300 hover:bg-base-200"
                }`}
                title="Pen Tool"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                <span>Draw</span>
              </button>

              <button
                type="button"
                onClick={() => setTool("eraser")}
                className={`btn btn-xs h-7 px-2 rounded-md font-medium border flex items-center gap-1 ${
                  tool === "eraser"
                    ? "bg-primary text-primary-content border-primary"
                    : "bg-base-100 text-base-content/70 border-base-300 hover:bg-base-200"
                }`}
                title="Eraser Tool"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span>Erase</span>
              </button>
            </div>

            {/* Colors (only active when Pen is selected) */}
            {tool === "pen" && (
              <div className="flex items-center gap-1 shrink-0 overflow-x-auto no-scrollbar py-0.5">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`w-5 h-5 rounded-full border transition-transform flex items-center justify-center ${
                      color === c.value
                        ? "scale-110 ring-2 ring-primary ring-offset-1"
                        : "border-base-300 hover:scale-105"
                    }`}
                    style={{
                      backgroundColor:
                        c.value === "DEFAULT"
                          ? isDark
                            ? "#ffffff"
                            : "#1f2937"
                          : c.value,
                    }}
                    title={c.label}
                  />
                ))}

                {/* Custom Color Input */}
                <label
                  className={`w-5 h-5 rounded-full border border-base-300 cursor-pointer overflow-hidden relative flex items-center justify-center ${
                    color === "CUSTOM"
                      ? "scale-110 ring-2 ring-primary ring-offset-1"
                      : "hover:scale-105"
                  }`}
                  title="Pick Custom Color"
                  style={{ backgroundColor: customColor }}
                >
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      setColor("CUSTOM");
                    }}
                    className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                  />
                </label>
              </div>
            )}

            {/* Stroke Width Selector */}
            <div className="flex items-center gap-1 shrink-0">
              {STROKE_WIDTHS.map((s) => (
                <button
                  key={s.size}
                  type="button"
                  onClick={() => setStrokeWidth(s.size)}
                  className={`btn btn-ghost btn-xs h-6 px-1.5 text-[11px] rounded font-mono ${
                    strokeWidth === s.size
                      ? "bg-base-200 text-primary font-bold border border-base-300"
                      : "text-base-content/60"
                  }`}
                  title={`${s.label} stroke (${s.size}px)`}
                >
                  {s.size}px
                </button>
              ))}
            </div>

            {/* Undo / Redo & Clear */}
            <div className="flex items-center gap-1 shrink-0 ml-auto">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                className="btn btn-ghost btn-xs h-7 px-1.5 rounded-md border border-base-300 disabled:opacity-30 text-base-content/70 hover:text-base-content"
                title="Undo (Ctrl+Z)"
              >
                ↶
              </button>

              <button
                type="button"
                onClick={handleRedo}
                disabled={!canRedo}
                className="btn btn-ghost btn-xs h-7 px-1.5 rounded-md border border-base-300 disabled:opacity-30 text-base-content/70 hover:text-base-content"
                title="Redo"
              >
                ↷
              </button>

              <button
                type="button"
                onClick={handleClearCanvas}
                className="btn btn-ghost btn-xs h-7 px-2 rounded-md border border-base-300 text-error hover:bg-error/10 font-semibold"
                title="Clear entire whiteboard"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div
            ref={containerRef}
            className="flex-1 w-full h-full relative overflow-hidden bg-base-100 cursor-crosshair touch-none select-none"
            style={{ touchAction: "none" }}
          >
            {/* Subtle grid pattern background */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: isDark
                  ? "radial-gradient(#ffffff 1px, transparent 1px)"
                  : "radial-gradient(#000000 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />

            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="w-full h-full block absolute inset-0 touch-none"
              style={{ touchAction: "none" }}
            />
          </div>
        </div>
      ) : (
        /* Text Notes Tab */
        <div className="flex-1 flex flex-col min-h-0 p-3 select-text">
          <textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder="Jot down algorithm ideas, edge cases, time/space complexity analysis, or pseudocode here...

Auto-saves per problem."
            className="w-full h-full flex-1 p-3.5 bg-base-200/40 rounded-xl border border-base-300 text-base-content text-xs sm:text-[13px] leading-relaxed font-mono resize-none outline-none focus:border-primary focus:bg-base-100 transition-colors select-text cursor-text"
          />
        </div>
      )}
    </div>
  );
};

export default Scratchpad;
