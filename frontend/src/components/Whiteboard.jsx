import { useState, useEffect, useRef, useCallback } from "react";

const TOOLS = [
  { id: "select", label: "Select / Move", icon: "select", hotkey: "V" },
  { id: "pen", label: "Freehand Pen", icon: "pen", hotkey: "P" },
  { id: "rectangle", label: "Rectangle", icon: "rectangle", hotkey: "R" },
  { id: "ellipse", label: "Circle / Ellipse", icon: "ellipse", hotkey: "C" },
  { id: "line", label: "Line", icon: "line", hotkey: "L" },
  { id: "arrow", label: "Arrow", icon: "arrow", hotkey: "A" },
  { id: "text", label: "Text", icon: "text", hotkey: "T" },
  { id: "eraser", label: "Eraser", icon: "eraser", hotkey: "E" },
];

const STROKE_COLORS = [
  { label: "Default", value: "DEFAULT" },
  { label: "Red", value: "#ef4444" },
  { label: "Green", value: "#10b981" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Yellow", value: "#eab308" },
  { label: "Orange", value: "#f97316" },
];

const STROKE_WIDTHS = [
  { label: "Thin", size: 2 },
  { label: "Medium", size: 4 },
  { label: "Thick", size: 8 },
];

const FILL_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Semi", value: "semi" },
  { label: "Solid", value: "solid" },
];

let elementCounter = 0;
function createShapeId(prefix = "el") {
  elementCounter += 1;
  return `${prefix}-${Date.now()}-${elementCounter}`;
}

// Distance from point (px, py) to line segment (x1, y1)-(x2, y2)
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// Bounding box helper for elements
function getElementBounds(el) {
  if (el.type === "pen" && el.points?.length > 0) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of el.points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    return { x: minX - 4, y: minY - 4, width: maxX - minX + 8, height: maxY - minY + 8 };
  }
  if (el.type === "rectangle" || el.type === "ellipse") {
    const x = Math.min(el.x, el.x + el.width);
    const y = Math.min(el.y, el.y + el.height);
    const w = Math.abs(el.width);
    const h = Math.abs(el.height);
    return { x, y, width: w, height: h };
  }
  if (el.type === "line" || el.type === "arrow") {
    const minX = Math.min(el.x, el.endX);
    const minY = Math.min(el.y, el.endY);
    const maxX = Math.max(el.x, el.endX);
    const maxY = Math.max(el.y, el.endY);
    return { x: minX - 6, y: minY - 6, width: maxX - minX + 12, height: maxY - minY + 12 };
  }
  if (el.type === "text") {
    const width = el.width || 80;
    const height = el.height || 24;
    return { x: el.x, y: el.y, width, height };
  }
  return { x: el.x, y: el.y, width: el.width || 0, height: el.height || 0 };
}

// Hit-testing function: returns true if point (px, py) is inside or near element
function isPointOnElement(px, py, el) {
  const threshold = Math.max(8, (el.strokeWidth || 4) * 2);

  if (el.type === "pen" && el.points?.length > 1) {
    for (let i = 0; i < el.points.length - 1; i++) {
      const p1 = el.points[i];
      const p2 = el.points[i + 1];
      if (distToSegment(px, py, p1.x, p1.y, p2.x, p2.y) <= threshold) {
        return true;
      }
    }
    return false;
  }

  if (el.type === "rectangle") {
    const b = getElementBounds(el);
    if (el.fill !== "none") {
      return px >= b.x && px <= b.x + b.width && py >= b.y && py <= b.y + b.height;
    }
    // Border check
    const nearLeft = Math.abs(px - b.x) <= threshold && py >= b.y && py <= b.y + b.height;
    const nearRight = Math.abs(px - (b.x + b.width)) <= threshold && py >= b.y && py <= b.y + b.height;
    const nearTop = Math.abs(py - b.y) <= threshold && px >= b.x && px <= b.x + b.width;
    const nearBottom = Math.abs(py - (b.y + b.height)) <= threshold && px >= b.x && px <= b.x + b.width;
    return nearLeft || nearRight || nearTop || nearBottom;
  }

  if (el.type === "ellipse") {
    const b = getElementBounds(el);
    const rx = b.width / 2;
    const ry = b.height / 2;
    if (rx === 0 || ry === 0) return false;
    const cx = b.x + rx;
    const cy = b.y + ry;
    const norm = Math.pow(px - cx, 2) / Math.pow(rx, 2) + Math.pow(py - cy, 2) / Math.pow(ry, 2);
    if (el.fill !== "none") {
      return norm <= 1.05;
    }
    return Math.abs(Math.sqrt(norm) - 1) <= 0.25;
  }

  if (el.type === "line" || el.type === "arrow") {
    return distToSegment(px, py, el.x, el.y, el.endX, el.endY) <= threshold;
  }

  if (el.type === "text") {
    const b = getElementBounds(el);
    return px >= b.x && px <= b.x + b.width && py >= b.y && py <= b.y + b.height;
  }

  return false;
}

const Whiteboard = ({
  problemId,
  isDark = false,
  onClose,
  isFloating = false,
  onToggleFloat,
}) => {
  const [activeTab, setActiveTab] = useState("board"); // 'board' | 'notes'
  const [tool, setTool] = useState("pen");
  const [strokeColor, setStrokeColor] = useState("DEFAULT");
  const [customColor, setCustomColor] = useState("#3b82f6");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [fillMode, setFillMode] = useState("none"); // 'none' | 'semi' | 'solid'
  const [selectedId, setSelectedId] = useState(null);
  const [savedStatus, setSavedStatus] = useState("Synced");

  // Elements state loaded from LocalStorage
  const [elements, setElements] = useState(() => {
    if (!problemId) return [];
    try {
      const raw = localStorage.getItem(`scratchpad-elements-${problemId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // safe fallback
    }
    return [];
  });

  // Notes state loaded from LocalStorage
  const [notes, setNotes] = useState(() => {
    if (!problemId) return "";
    try {
      const raw =
        localStorage.getItem(`scratchpad-notes-${problemId}`) ||
        localStorage.getItem(`scratchpad-problem-${problemId}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          return parsed?.notes || "";
        } catch {
          return raw;
        }
      }
    } catch {
      // safe fallback
    }
    return "";
  });

  // Undo / Redo history
  const historyRef = useRef([]);
  const redoRef = useRef([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // In-progress drawing / dragging state
  const isInteractingRef = useRef(false);
  const currentElementRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Inline text editing state
  const [editingText, setEditingText] = useState(null); // { id, x, y, text }
  const textInputRef = useRef(null);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Active stroke color calculation
  const getComputedColor = useCallback(
    (colorVal) => {
      if (!colorVal || colorVal === "DEFAULT") {
        return isDark ? "#f3f4f6" : "#1f2937";
      }
      if (colorVal === "CUSTOM") {
        return customColor;
      }
      return colorVal;
    },
    [isDark, customColor],
  );

  // Save elements to LocalStorage
  const persistElements = useCallback(
    (newElements) => {
      if (!problemId) return;
      try {
        localStorage.setItem(`scratchpad-elements-${problemId}`, JSON.stringify(newElements));
        setSavedStatus("Saved");
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          setSavedStatus("Synced");
        }, 1200);
      } catch (e) {
        console.warn("Failed to persist whiteboard elements:", e);
      }
    },
    [problemId],
  );

  // Save notes to LocalStorage
  const persistNotes = useCallback(
    (newNotes) => {
      if (!problemId) return;
      try {
        localStorage.setItem(`scratchpad-notes-${problemId}`, newNotes);
        setSavedStatus("Saved");
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          setSavedStatus("Synced");
        }, 1200);
      } catch (e) {
        console.warn("Failed to persist whiteboard notes:", e);
      }
    },
    [problemId],
  );

  // Snapshot current elements into history for Undo
  const pushHistory = useCallback(
    (prevElements) => {
      historyRef.current.push(JSON.stringify(prevElements));
      if (historyRef.current.length > 30) historyRef.current.shift();
      redoRef.current = [];
      setCanUndo(true);
      setCanRedo(false);
    },
    [],
  );

  // Undo
  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const current = JSON.stringify(elements);
    redoRef.current.push(current);
    setCanRedo(true);

    const prevRaw = historyRef.current.pop();
    setCanUndo(historyRef.current.length > 0);

    const prev = JSON.parse(prevRaw);
    setElements(prev);
    persistElements(prev);
    setSelectedId(null);
  }, [elements, persistElements]);

  // Redo
  const handleRedo = useCallback(() => {
    if (redoRef.current.length === 0) return;
    const current = JSON.stringify(elements);
    historyRef.current.push(current);
    setCanUndo(true);

    const nextRaw = redoRef.current.pop();
    setCanRedo(redoRef.current.length > 0);

    const next = JSON.parse(nextRaw);
    setElements(next);
    persistElements(next);
  }, [elements, persistElements]);

  // Keyboard Shortcuts inside Whiteboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if focused on text input / textarea
      if (e.target?.tagName === "INPUT" || e.target?.tagName === "TEXTAREA") {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          e.preventDefault();
          pushHistory(elements);
          const next = elements.filter((el) => el.id !== selectedId);
          setElements(next);
          persistElements(next);
          setSelectedId(null);
        }
        return;
      }

      if (e.key === "Escape") {
        setSelectedId(null);
        setEditingText(null);
        return;
      }

      // Tool selection shortcuts
      const key = e.key.toLowerCase();
      if (key === "v") setTool("select");
      else if (key === "p") setTool("pen");
      else if (key === "r") setTool("rectangle");
      else if (key === "c") setTool("ellipse");
      else if (key === "l") setTool("line");
      else if (key === "a") setTool("arrow");
      else if (key === "t") setTool("text");
      else if (key === "e") setTool("eraser");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [elements, selectedId, handleUndo, handleRedo, pushHistory, persistElements]);

  // Draw element onto 2D Canvas context
  const renderElement = useCallback(
    (ctx, el, isSelected = false) => {
      ctx.save();
      const color = getComputedColor(el.strokeColor);
      ctx.strokeStyle = color;
      ctx.lineWidth = el.strokeWidth || 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Calculate fill color
      let fillColor = "transparent";
      if (el.fill === "solid") {
        fillColor = color;
      } else if (el.fill === "semi") {
        fillColor = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)";
      }

      if (el.type === "pen" && el.points?.length > 0) {
        ctx.beginPath();
        const pts = el.points;
        if (pts.length === 1) {
          ctx.arc(pts[0].x, pts[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        } else {
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length - 1; i++) {
            const xc = (pts[i].x + pts[i + 1].x) / 2;
            const yc = (pts[i].y + pts[i + 1].y) / 2;
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
          }
          ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
          ctx.stroke();
        }
      } else if (el.type === "rectangle") {
        const x = Math.min(el.x, el.x + el.width);
        const y = Math.min(el.y, el.y + el.height);
        const w = Math.abs(el.width);
        const h = Math.abs(el.height);
        if (el.fill !== "none") {
          ctx.fillStyle = fillColor;
          ctx.fillRect(x, y, w, h);
        }
        ctx.strokeRect(x, y, w, h);
      } else if (el.type === "ellipse") {
        const x = Math.min(el.x, el.x + el.width);
        const y = Math.min(el.y, el.y + el.height);
        const w = Math.abs(el.width);
        const h = Math.abs(el.height);
        const cx = x + w / 2;
        const cy = y + h / 2;
        const rx = w / 2;
        const ry = h / 2;
        if (rx > 0 && ry > 0) {
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          if (el.fill !== "none") {
            ctx.fillStyle = fillColor;
            ctx.fill();
          }
          ctx.stroke();
        }
      } else if (el.type === "line") {
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(el.endX, el.endY);
        ctx.stroke();
      } else if (el.type === "arrow") {
        // Line
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(el.endX, el.endY);
        ctx.stroke();

        // Arrowhead
        const angle = Math.atan2(el.endY - el.y, el.endX - el.x);
        const headLength = Math.max(12, ctx.lineWidth * 3.5);
        ctx.beginPath();
        ctx.moveTo(el.endX, el.endY);
        ctx.lineTo(
          el.endX - headLength * Math.cos(angle - Math.PI / 6),
          el.endY - headLength * Math.sin(angle - Math.PI / 6),
        );
        ctx.moveTo(el.endX, el.endY);
        ctx.lineTo(
          el.endX - headLength * Math.cos(angle + Math.PI / 6),
          el.endY - headLength * Math.sin(angle + Math.PI / 6),
        );
        ctx.stroke();
      } else if (el.type === "text") {
        ctx.font = `${el.fontSize || 16}px "JetBrains Mono", monospace, sans-serif`;
        ctx.fillStyle = color;
        ctx.textBaseline = "top";
        const lines = (el.text || "").split("\n");
        const lineHeight = (el.fontSize || 16) * 1.35;
        lines.forEach((line, i) => {
          ctx.fillText(line, el.x, el.y + i * lineHeight);
        });
      }

      // Draw dashed selection outline if selected
      if (isSelected) {
        const bounds = getElementBounds(el);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bounds.x - 3, bounds.y - 3, bounds.width + 6, bounds.height + 6);

        // Corner selection anchors
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(bounds.x - 5, bounds.y - 5, 6, 6);
        ctx.fillRect(bounds.x + bounds.width - 1, bounds.y - 5, 6, 6);
        ctx.fillRect(bounds.x - 5, bounds.y + bounds.height - 1, 6, 6);
        ctx.fillRect(bounds.x + bounds.width - 1, bounds.y + bounds.height - 1, 6, 6);
      }

      ctx.restore();
    },
    [getComputedColor, isDark],
  );

  // Redraw Canvas on changes
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    // Draw all confirmed elements
    for (const el of elements) {
      // Don't render text currently being edited
      if (editingText && editingText.id === el.id) continue;
      renderElement(ctx, el, selectedId === el.id);
    }

    // Draw active drawing element preview
    if (currentElementRef.current) {
      renderElement(ctx, currentElementRef.current, false);
    }

    ctx.restore();
  }, [elements, selectedId, editingText, renderElement]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Adjust canvas resolution to container rect using devicePixelRatio
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width <= 0 || height <= 0) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        redraw();
      }
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, [redraw]);

  // Coordinate helper
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Pointer Down
  const handlePointerDown = (e) => {
    if (activeTab !== "board") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    canvas.setPointerCapture?.(e.pointerId);

    const { x, y } = getCanvasCoords(e);
    isInteractingRef.current = true;

    // Finish text editing if clicking elsewhere
    if (editingText) {
      finishTextEditing();
      return;
    }

    if (tool === "select") {
      // Find clicked element in reverse order (topmost first)
      const hit = [...elements].reverse().find((el) => isPointOnElement(x, y, el));
      if (hit) {
        setSelectedId(hit.id);
        dragOffsetRef.current = { x, y };
      } else {
        setSelectedId(null);
      }
      return;
    }

    if (tool === "eraser") {
      const hit = [...elements].reverse().find((el) => isPointOnElement(x, y, el));
      if (hit) {
        pushHistory(elements);
        const next = elements.filter((el) => el.id !== hit.id);
        setElements(next);
        persistElements(next);
        if (selectedId === hit.id) setSelectedId(null);
      }
      return;
    }

    if (tool === "text") {
      const hit = [...elements].reverse().find((el) => el.type === "text" && isPointOnElement(x, y, el));
      if (hit) {
        setEditingText({ id: hit.id, x: hit.x, y: hit.y, text: hit.text });
      } else {
        setEditingText({ id: createShapeId("text"), x, y, text: "", isNew: true });
      }
      return;
    }

    // Creating new vector shape
    pushHistory(elements);
    const id = createShapeId("el");

    if (tool === "pen") {
      currentElementRef.current = {
        id,
        type: "pen",
        points: [{ x, y }],
        strokeColor,
        strokeWidth,
        fill: "none",
      };
    } else if (tool === "rectangle" || tool === "ellipse") {
      currentElementRef.current = {
        id,
        type: tool,
        x,
        y,
        width: 0,
        height: 0,
        strokeColor,
        strokeWidth,
        fill: fillMode,
      };
    } else if (tool === "line" || tool === "arrow") {
      currentElementRef.current = {
        id,
        type: tool,
        x,
        y,
        endX: x,
        endY: y,
        strokeColor,
        strokeWidth,
        fill: "none",
      };
    }

    redraw();
  };

  // Pointer Move
  const handlePointerMove = (e) => {
    if (!isInteractingRef.current || activeTab !== "board") return;
    const { x, y } = getCanvasCoords(e);

    if (tool === "select" && selectedId) {
      const dx = x - dragOffsetRef.current.x;
      const dy = y - dragOffsetRef.current.y;
      dragOffsetRef.current = { x, y };

      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== selectedId) return el;
          if (el.type === "pen") {
            return {
              ...el,
              points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
            };
          }
          if (el.type === "line" || el.type === "arrow") {
            return {
              ...el,
              x: el.x + dx,
              y: el.y + dy,
              endX: el.endX + dx,
              endY: el.endY + dy,
            };
          }
          return { ...el, x: el.x + dx, y: el.y + dy };
        }),
      );
      return;
    }

    if (tool === "eraser") {
      const hit = [...elements].reverse().find((el) => isPointOnElement(x, y, el));
      if (hit) {
        const next = elements.filter((el) => el.id !== hit.id);
        setElements(next);
        persistElements(next);
        if (selectedId === hit.id) setSelectedId(null);
      }
      return;
    }

    const curr = currentElementRef.current;
    if (!curr) return;

    if (curr.type === "pen") {
      curr.points.push({ x, y });
    } else if (curr.type === "rectangle" || curr.type === "ellipse") {
      curr.width = x - curr.x;
      curr.height = y - curr.y;
    } else if (curr.type === "line" || curr.type === "arrow") {
      curr.endX = x;
      curr.endY = y;
    }

    redraw();
  };

  // Pointer Up
  const handlePointerUp = (e) => {
    if (!isInteractingRef.current) return;
    isInteractingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture?.(e.pointerId);
      } catch {
        // safe ignore
      }
    }

    if (tool === "select" && selectedId) {
      persistElements(elements);
      return;
    }

    const curr = currentElementRef.current;
    if (!curr) return;

    // Filter out accidental clicks (zero width/points)
    let isValid = true;
    if (curr.type === "pen" && curr.points.length <= 1) {
      // Single click dot is valid
      isValid = true;
    } else if (
      (curr.type === "rectangle" || curr.type === "ellipse") &&
      Math.abs(curr.width) < 3 &&
      Math.abs(curr.height) < 3
    ) {
      isValid = false;
    } else if (
      (curr.type === "line" || curr.type === "arrow") &&
      Math.hypot(curr.endX - curr.x, curr.endY - curr.y) < 4
    ) {
      isValid = false;
    }

    if (isValid) {
      const nextElements = [...elements, curr];
      setElements(nextElements);
      persistElements(nextElements);
      setSelectedId(curr.id);
    }

    currentElementRef.current = null;
    redraw();
  };

  // Finish text editing
  const finishTextEditing = () => {
    if (!editingText) return;
    const trimmed = editingText.text.trim();

    if (!trimmed) {
      // If empty, remove if existing
      if (!editingText.isNew) {
        const next = elements.filter((el) => el.id !== editingText.id);
        setElements(next);
        persistElements(next);
      }
    } else {
      pushHistory(elements);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const fontSize = 16;
      let textWidth = 80;
      if (ctx) {
        ctx.font = `${fontSize}px "JetBrains Mono", monospace, sans-serif`;
        const lines = trimmed.split("\n");
        textWidth = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 12;
      }

      const updated = {
        id: editingText.id,
        type: "text",
        x: editingText.x,
        y: editingText.y,
        width: textWidth,
        height: (trimmed.split("\n").length || 1) * fontSize * 1.4,
        text: trimmed,
        fontSize,
        strokeColor,
        strokeWidth: 2,
        fill: "none",
      };

      let next;
      if (editingText.isNew) {
        next = [...elements, updated];
      } else {
        next = elements.map((el) => (el.id === editingText.id ? updated : el));
      }
      setElements(next);
      persistElements(next);
      setSelectedId(updated.id);
    }

    setEditingText(null);
  };

  // Clear Canvas
  const handleClearCanvas = () => {
    if (elements.length === 0) return;
    pushHistory(elements);
    setElements([]);
    persistElements([]);
    setSelectedId(null);
  };

  // Download image
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext("2d");

    // Fill background
    ctx.fillStyle = isDark ? "#1d232a" : "#ffffff";
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(canvas, 0, 0);

    const link = document.createElement("a");
    link.download = `whiteboard-${problemId || "drawing"}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  };

  // Plain Text Notes handler
  const handleNotesChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    persistNotes(val);
  };

  return (
    <div className="flex flex-col h-full w-full bg-base-100 overflow-hidden relative font-sans">
      {/* Header bar: Tabs & Utilities */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-base-300 bg-base-200/75 shrink-0 gap-2 select-none">
        {/* Canvas vs Notes Tab Switcher */}
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
            <span>Whiteboard</span>
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

        {/* Sync status & Action controls */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-medium text-base-content/45 tracking-tight hidden sm:inline">
            {savedStatus}
          </span>

          {activeTab === "board" && (
            <button
              type="button"
              onClick={handleDownload}
              className="btn btn-ghost btn-xs h-7 px-1.5 rounded-md border border-base-300 text-base-content/70 hover:text-base-content"
              title="Export as PNG Image"
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

          {/* Toggle between Split Column & Floating Window */}
          {onToggleFloat && (
            <button
              type="button"
              onClick={onToggleFloat}
              className="btn btn-ghost btn-xs h-7 px-1.5 rounded-md border border-base-300 text-base-content/70 hover:text-base-content hidden sm:inline-flex"
              title={isFloating ? "Dock into 3-column layout" : "Pop out as floating window"}
            >
              {isFloating ? "Dock" : "Pop Out"}
            </button>
          )}

          {/* Close button only when embedded without an outer floating window header */}
          {!isFloating && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-xs h-7 px-1.5 rounded-md text-base-content/60 hover:text-base-content"
              title="Close Whiteboard"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {activeTab === "board" ? (
        <div className="flex flex-col flex-1 min-h-0 relative">
          {/* Tool Action Header: Drawing Tools + Undo / Redo / Clear */}
          <div className="flex items-center justify-between gap-1.5 px-2 py-1.5 border-b border-base-300 bg-base-100 shrink-0 text-xs">
            {/* Primary Tool Buttons */}
            <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1">
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTool(t.id);
                    if (t.id !== "select") setSelectedId(null);
                  }}
                  className={`btn btn-xs h-7 px-2 rounded-md font-medium border flex items-center gap-1 transition-all shrink-0 ${
                    tool === t.id
                      ? "bg-primary text-primary-content border-primary shadow-xs"
                      : "bg-base-100 text-base-content/70 border-base-300 hover:bg-base-200"
                  }`}
                  title={`${t.label} (${t.hotkey})`}
                >
                  {/* Tool Icons */}
                  {t.id === "select" && (
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3l7 18 3-7 7-3L3 3z" />
                    </svg>
                  )}
                  {t.id === "pen" && (
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  )}
                  {t.id === "rectangle" && (
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                  )}
                  {t.id === "ellipse" && (
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                  )}
                  {t.id === "line" && (
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="4" y1="20" x2="20" y2="4" />
                    </svg>
                  )}
                  {t.id === "arrow" && (
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  )}
                  {t.id === "text" && <span className="font-bold font-mono text-xs">T</span>}
                  {t.id === "eraser" && (
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                  <span className="hidden xl:inline text-[11px]">{t.label.split(" ")[0]}</span>
                </button>
              ))}
            </div>

            {/* History & Clear - Always pinned and visible */}
            <div className="flex items-center gap-1 shrink-0">
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
                title="Redo (Ctrl+Y)"
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

          {/* Row 2: Secondary Styling Bar: Colors, Stroke Width, Fill Mode */}
          {tool !== "eraser" && (
            <div className="flex items-center gap-2.5 px-2.5 py-1 bg-base-200/50 border-b border-base-300/80 shrink-0 text-xs overflow-x-auto no-scrollbar">
              {/* Color Palette */}
              <div className="flex items-center gap-1 shrink-0">
                {STROKE_COLORS.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setStrokeColor(c.value)}
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border transition-transform shrink-0 ${
                      strokeColor === c.value
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

                {/* Native Color Picker */}
                <label
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-base-300 cursor-pointer relative overflow-hidden flex items-center justify-center shrink-0 ${
                    strokeColor === "CUSTOM"
                      ? "scale-110 ring-2 ring-primary ring-offset-1"
                      : "hover:scale-105"
                  }`}
                  title="Custom Color"
                  style={{ backgroundColor: customColor }}
                >
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      setStrokeColor("CUSTOM");
                    }}
                    className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                  />
                </label>
              </div>

              <div className="h-3.5 w-px bg-base-300 shrink-0" />

              {/* Stroke Width */}
              {(tool === "pen" || tool === "rectangle" || tool === "ellipse" || tool === "line" || tool === "arrow") && (
                <div className="flex items-center gap-0.5 shrink-0">
                  {STROKE_WIDTHS.map((s) => (
                    <button
                      key={s.size}
                      type="button"
                      onClick={() => setStrokeWidth(s.size)}
                      className={`btn btn-ghost btn-xs h-6 px-1.5 text-[10px] rounded font-mono ${
                        strokeWidth === s.size
                          ? "bg-base-200 text-primary font-bold border border-base-300"
                          : "text-base-content/60"
                      }`}
                      title={`${s.label} stroke`}
                    >
                      {s.size}px
                    </button>
                  ))}
                </div>
              )}

              {/* Fill Mode (for Rectangle & Ellipse) */}
              {(tool === "rectangle" || tool === "ellipse") && (
                <>
                  <div className="h-3.5 w-px bg-base-300 shrink-0" />
                  <div className="flex items-center gap-0.5 shrink-0">
                    {FILL_OPTIONS.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setFillMode(f.value)}
                        className={`btn btn-ghost btn-xs h-6 px-1.5 text-[10px] rounded capitalize ${
                          fillMode === f.value
                            ? "bg-base-200 text-primary font-bold border border-base-300"
                            : "text-base-content/60"
                        }`}
                        title={`${f.label} fill`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Interactive Canvas Work Area */}
          <div
            ref={containerRef}
            className="flex-1 w-full h-full relative overflow-hidden bg-base-100 touch-none cursor-crosshair select-none"
            style={{
              cursor:
                tool === "select"
                  ? selectedId
                    ? "move"
                    : "default"
                  : tool === "eraser"
                    ? "pointer"
                    : tool === "text"
                      ? "text"
                      : "crosshair",
              touchAction: "none",
            }}
          >
            {/* Subtle Excalidraw-like Dot Grid Background */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: isDark
                  ? "radial-gradient(#ffffff 1px, transparent 1px)"
                  : "radial-gradient(#000000 1px, transparent 1px)",
                backgroundSize: "24px 24px",
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

            {/* Inline Text Input overlay when typing text */}
            {editingText && (
              <div
                className="absolute z-20"
                style={{
                  left: `${editingText.x}px`,
                  top: `${editingText.y}px`,
                }}
              >
                <textarea
                  ref={textInputRef}
                  autoFocus
                  value={editingText.text}
                  onChange={(e) => setEditingText((prev) => ({ ...prev, text: e.target.value }))}
                  onBlur={finishTextEditing}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      finishTextEditing();
                    } else if (e.key === "Escape") {
                      setEditingText(null);
                    }
                  }}
                  placeholder="Type note..."
                  className="p-1 bg-base-100 border border-primary rounded shadow-lg text-sm font-mono text-base-content resize-none outline-none min-w-[120px] min-h-[36px] select-text"
                  style={{
                    color: getComputedColor(strokeColor),
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Plain Text Notes Tab */
        <div className="flex-1 flex flex-col min-h-0 p-3 select-text">
          <textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder="Jot down algorithm ideas, test cases, time & space complexities, or pseudocode...

Auto-saves per problem."
            className="w-full h-full flex-1 p-3.5 bg-base-200/40 rounded-xl border border-base-300 text-base-content text-xs sm:text-[13px] leading-relaxed font-mono resize-none outline-none focus:border-primary focus:bg-base-100 transition-colors select-text cursor-text"
          />
        </div>
      )}
    </div>
  );
};

export default Whiteboard;
