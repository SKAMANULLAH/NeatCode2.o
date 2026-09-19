import { useState, useEffect, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { useParams, NavLink, useLocation, useNavigate } from "react-router";
import axiosClient from "../utils/axiosClient";
import ProblemContent from "../components/ProblemContent";
import AppNav from "../components/AppNav";
import { useTheme } from "../context/useTheme";
import Whiteboard from "../components/Whiteboard";
import FloatingWindow from "../components/FloatingWindow";

const getCodeStorageKey = (id, language) => `problem-code-${id}-${language}`;

const LANGUAGE_CONFIG = {
  javascript: {
    databaseLanguage: "nodejs",
    versionIndex: 7,
    monacoLanguage: "javascript",
    label: "JavaScript",
  },

  java: {
    databaseLanguage: "java",
    versionIndex: 6,
    monacoLanguage: "java",
    label: "Java",
  },

  cpp: {
    databaseLanguage: "cpp17",
    versionIndex: 3,
    monacoLanguage: "cpp",
    label: "C++",
  },
};

const ProblemPage = () => {
  const [leftPanelSize, setLeftPanelSize] = useState(() => {
    try {
      const saved = localStorage.getItem("problem-page-left-size");
      return saved ? Math.max(20, Math.min(80, Number(saved))) : 50;
    } catch {
      return 50;
    }
  });
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  // Floating Window Visibility State with LocalStorage Persistence
  const [showProblemWindow, setShowProblemWindow] = useState(() => {
    try {
      const saved = localStorage.getItem("problem-page-show-problem");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });

  const [showWhiteboardWindow, setShowWhiteboardWindow] = useState(() => {
    try {
      const saved = localStorage.getItem("problem-page-show-whiteboard");
      return saved === "true";
    } catch {
      return false;
    }
  });

  // Dynamic Z-Index Layer Management ('problem' vs 'whiteboard')
  const [topWindow, setTopWindow] = useState("problem");

  const [problem, setProblem] = useState(null);
  const [problemError, setProblemError] = useState("");

  const [selectedLanguage, setSelectedLanguage] = useState("cpp");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [codes, setCodes] = useState({
    javascript: "",
    java: "",
    cpp: "",
  });
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const [runLoading, setRunLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [fetchingProblem, setFetchingProblem] = useState(true);

  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState("description");
  const [activeRightTab, setActiveRightTab] = useState("code");
  const [solved, setSolved] = useState(false);
  const [referenceSolution, setReferenceSolution] = useState([]);
  const [solutionMessage, setSolutionMessage] = useState("");
  const [usage, setUsage] = useState(null);
  const [copied, setCopied] = useState(false);
  const [mobilePanel, setMobilePanel] = useState("problem"); // 'problem' | 'editor' | 'board'

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const handleRunRef = useRef(null);
  const handleSubmitRef = useRef(null);

  const { problemId } = useParams();
  const { isDark } = useTheme();

  const location = useLocation();
  const navigate = useNavigate();

  const locationProblems = location.state?.problems;
  const [fetchedProblems, setFetchedProblems] = useState([]);
  const problemList =
    locationProblems && locationProblems.length > 0
      ? locationProblems
      : fetchedProblems;

  // Toggle Floating Problem Window
  const toggleProblemWindow = useCallback(() => {
    setShowProblemWindow((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("problem-page-show-problem", String(next));
      } catch {
        /* ignore */
      }
      if (next) {
        setTopWindow("problem");
      }
      return next;
    });
  }, []);

  // Toggle Floating Whiteboard Window
  const toggleWhiteboardWindow = useCallback(() => {
    setShowWhiteboardWindow((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("problem-page-show-whiteboard", String(next));
      } catch {
        /* ignore */
      }
      if (next) {
        setTopWindow("whiteboard");
      }
      return next;
    });
  }, []);

  // Auto-fetch problem list fallback so next/prev navigation works even on direct URL visit or refresh
  useEffect(() => {
    if (!locationProblems?.length && fetchedProblems.length === 0) {
      axiosClient
        .get("/problem/fetchProblemAll")
        .then((response) => {
          if (Array.isArray(response.data)) {
            setFetchedProblems(response.data);
          }
        })
        .catch((err) => {
          console.error("Failed to load problem list for navigation:", err);
        });
    }
  }, [locationProblems, fetchedProblems.length]);

  const currentProblemIndex = problemList.findIndex(
    (problem) => problem._id === problemId,
  );

  const previousProblem =
    currentProblemIndex > 0 ? problemList[currentProblemIndex - 1] : null;

  const nextProblem =
    currentProblemIndex >= 0 && currentProblemIndex < problemList.length - 1
      ? problemList[currentProblemIndex + 1]
      : null;

  const navigateToPrevious = useCallback(() => {
    if (previousProblem) {
      setRunResult(null);
      setSubmitResult(null);
      setSelectedSubmission(null);
      setSubmissions([]);
      setActiveRightTab("code");
      navigate(`/problem/${previousProblem._id}`, {
        state: { problems: problemList },
      });
    }
  }, [previousProblem, problemList, navigate]);

  const navigateToNext = useCallback(() => {
    if (nextProblem) {
      setRunResult(null);
      setSubmitResult(null);
      setSelectedSubmission(null);
      setSubmissions([]);
      setActiveRightTab("code");
      navigate(`/problem/${nextProblem._id}`, {
        state: { problems: problemList },
      });
    }
  }, [nextProblem, problemList, navigate]);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setFetchingProblem(true);
        setProblemError("");
        setRunResult(null);
        setSubmitResult(null);
        setSelectedSubmission(null);
        setSubmissions([]);
        setActiveRightTab("code");

        const response = await axiosClient.get(
          `/problem/fetchProblem/${problemId}`,
        );

        const problemData = response.data;

        setProblem(problemData);
        setSolved(Boolean(problemData.solved));

        const initialCodes = {
          javascript: "",
          java: "",
          cpp: "",
        };

        Object.keys(LANGUAGE_CONFIG).forEach((frontendLanguage) => {
          const databaseLanguage =
            LANGUAGE_CONFIG[frontendLanguage].databaseLanguage;

          const aliases = {
            javascript: ["nodejs", "JavaScript", "javascript"],
            java: ["java", "Java"],
            cpp: ["cpp17", "C++", "cpp"],
          };

          const startCode = problemData.startCode?.find((item) =>
            (aliases[frontendLanguage] || [databaseLanguage]).includes(
              item.language,
            ),
          );

          if (startCode) {
            initialCodes[frontendLanguage] = startCode.initialCode;
          }
        });

        const restoredCodes = { ...initialCodes };

        Object.keys(initialCodes).forEach((language) => {
          const savedCode = localStorage.getItem(getCodeStorageKey(problemId, language));

          if (savedCode !== null) {
            restoredCodes[language] = savedCode;
          }
        });

        setCodes(restoredCodes);
        try {
          const solutionResponse = await axiosClient.get(
            `/problem/fetchProblem/${problemId}/solution`,
          );
          setReferenceSolution(solutionResponse.data.referenceSolution || []);
          setSolutionMessage("");
          setSolved(true);
        } catch (solutionError) {
          setReferenceSolution([]);
          if (solutionError.response?.status === 403) {
            setSolved(Boolean(problemData.solved));
            setSolutionMessage(
              solutionError.response?.data?.message ||
                "You can only see the solution after solving this problem.",
            );
          } else if (solutionError.response?.status !== 401) {
            setSolutionMessage(
              solutionError.response?.data?.message ||
                "Failed to load solution",
            );
          }
        }
      } catch (error) {
        setProblem(null);
        setProblemError(
          error.response?.data?.message || "Failed to fetch problem",
        );
      } finally {
        setFetchingProblem(false);
      }
    };

    if (problemId) {
      fetchProblem();
    }
  }, [problemId]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (activeLeftTab !== "submissions" || !problemId) {
        return;
      }

      try {
        setSubmissionLoading(true);
        setSubmissionError("");

        const response = await axiosClient.get(
          `/problem/fetchProblemSubmission/${problemId}`,
        );

        if (Array.isArray(response.data)) {
          setSubmissions(response.data);
        } else {
          setSubmissions([]);
        }
      } catch (error) {
        console.error("Error fetching submissions:", error);

        if (error.response?.data === "No submissions") {
          setSubmissions([]);
          setSubmissionError("");
        } else {
          setSubmissionError(
            error.response?.data?.message ||
              error.response?.data?.error ||
              "Failed to fetch submissions",
          );
        }
      } finally {
        setSubmissionLoading(false);
      }
    };

    fetchSubmissions();
  }, [activeLeftTab, problemId]);

  const applyUsage = (nextUsage) => {
    if (nextUsage) {
      setUsage(nextUsage);
    }
  };

  const fetchOfficialSolution = async () => {
    try {
      const response = await axiosClient.get(
        `/problem/fetchProblem/${problemId}/solution`,
      );
      setReferenceSolution(response.data.referenceSolution || []);
      setSolutionMessage("");
      setSolved(true);
    } catch (error) {
      setReferenceSolution([]);
      if (error.response?.status === 403) {
        setSolved(false);
        setSolutionMessage(
          error.response?.data?.message ||
            "You can only see the solution after solving this problem.",
        );
      } else if (error.response?.status !== 401) {
        setSolutionMessage(
          error.response?.data?.message || "Failed to load solution",
        );
      }
    }
  };

  useEffect(() => {
    const loadUsage = async () => {
      try {
        const { data } = await axiosClient.get("/user/usage");
        setUsage(data);
      } catch {
        setUsage(null);
      }
    };

    if (problemId) {
      loadUsage();
    }
  }, [problemId]);

  const handleEditorChange = (value) => {
    const newCode = value || "";

    setCodes((prev) => ({
      ...prev,
      [selectedLanguage]: newCode,
    }));

    localStorage.setItem(getCodeStorageKey(problemId, selectedLanguage), newCode);
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Alt + Shift + Down: Copy line down
    editor.addAction({
      id: "action-copy-line-down",
      label: "Copy Line Down",
      keybindings: [
        monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.DownArrow,
      ],
      run: (ed) => {
        ed.trigger("keyboard", "editor.action.copyLinesDownAction");
      },
    });

    // Alt + Shift + Up: Copy line up
    editor.addAction({
      id: "action-copy-line-up",
      label: "Copy Line Up",
      keybindings: [
        monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.UpArrow,
      ],
      run: (ed) => {
        ed.trigger("keyboard", "editor.action.copyLinesUpAction");
      },
    });

    // Alt + Down: Move line down
    editor.addAction({
      id: "action-move-line-down",
      label: "Move Line Down",
      keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.DownArrow],
      run: (ed) => {
        ed.trigger("keyboard", "editor.action.moveLinesDownAction");
      },
    });

    // Alt + Up: Move line up
    editor.addAction({
      id: "action-move-line-up",
      label: "Move Line Up",
      keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.UpArrow],
      run: (ed) => {
        ed.trigger("keyboard", "editor.action.moveLinesUpAction");
      },
    });

    // Ctrl + Enter or Cmd + Enter: Run code
    editor.addAction({
      id: "action-run-code",
      label: "Run Code",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {
        handleRunRef.current?.();
      },
    });

    // Ctrl + Shift + Enter: Submit code
    editor.addAction({
      id: "action-submit-code",
      label: "Submit Code",
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
      ],
      run: () => {
        handleSubmitRef.current?.();
      },
    });
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(codes[selectedLanguage] || "");

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  const handleSelectAllCode = () => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        editorRef.current.setSelection(model.getFullModelRange());
        editorRef.current.focus();
      }
    }
  };

  const handleSelectLineCode = () => {
    if (editorRef.current) {
      const position = editorRef.current.getPosition();
      if (position) {
        const lineNumber = position.lineNumber;
        const lineContent =
          editorRef.current.getModel()?.getLineContent(lineNumber) || "";
        editorRef.current.setSelection({
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: lineContent.length + 1,
        });
        editorRef.current.focus();
      }
    }
  };

  const handleUndoCode = () => {
    if (editorRef.current) {
      editorRef.current.trigger("mobileBar", "undo");
      editorRef.current.focus();
    }
  };

  const handleRedoCode = () => {
    if (editorRef.current) {
      editorRef.current.trigger("mobileBar", "redo");
      editorRef.current.focus();
    }
  };

  const handleResetCode = () => {
    const initialCode =
      problem?.startCode?.find(
        (item) =>
          item.language === LANGUAGE_CONFIG[selectedLanguage].databaseLanguage,
      )?.initialCode || "";

    setCodes((previousCodes) => ({
      ...previousCodes,
      [selectedLanguage]: initialCode,
    }));

    localStorage.removeItem(getCodeStorageKey(problemId, selectedLanguage));

    setShowResetConfirm(false);
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
  };

  const handleRun = async () => {
    setRunLoading(true);
    setRunResult(null);
    setMobilePanel("editor");

    try {
      const config = LANGUAGE_CONFIG[selectedLanguage];

      const response = await axiosClient.post(`/code/run/${problemId}`, {
        code: codes[selectedLanguage],
        language: config.databaseLanguage,
        versionIndex: config.versionIndex,
      });

      applyUsage(response.data.usage);
      setRunResult(response.data);
      setActiveRightTab("testcase");
      if (isEditorFullscreen) {
        setShowProblemWindow(true);
      }
    } catch (error) {
      console.error("Error running code:", error);
      applyUsage(error.response?.data?.usage);

      setRunResult({
        message: "error",
        failedTestCase: null,
        testCasesPassed: 0,
        testCasesTotal: 0,
        expected: null,
        actual: null,
        error:
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.response?.data ||
          "Internal server error",
      });

      setActiveRightTab("testcase");
      if (isEditorFullscreen) {
        setShowProblemWindow(true);
      }
    } finally {
      setRunLoading(false);
    }
  };

  const handleSubmitCode = async () => {
    setSubmitLoading(true);
    setSubmitResult(null);
    setMobilePanel("editor");

    try {
      const config = LANGUAGE_CONFIG[selectedLanguage];

      const response = await axiosClient.post(`/code/submit/${problemId}`, {
        code: codes[selectedLanguage],
        language: config.databaseLanguage,
        versionIndex: config.versionIndex,
      });

      applyUsage(response.data.usage);
      setSubmitResult(response.data);
      setActiveRightTab("result");
      if (isEditorFullscreen) {
        setShowProblemWindow(true);
      }

      if (response.data.message === "accepted" || response.data.solved) {
        setSolved(true);
        await fetchOfficialSolution();
      }
    } catch (error) {
      console.error("Error submitting code:", error);
      applyUsage(error.response?.data?.usage);

      setSubmitResult({
        message: "error",
        failedTestCase: null,
        testCasesPassed: 0,
        testCasesTotal: 0,
        expected: null,
        actual: null,
        error:
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.response?.data ||
          "Submission failed",
      });

      setActiveRightTab("result");
      if (isEditorFullscreen) {
        setShowProblemWindow(true);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  useEffect(() => {
    handleRunRef.current = handleRun;
    handleSubmitRef.current = handleSubmitCode;
  });

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Escape exits fullscreen
      if (e.key === "Escape" && isEditorFullscreen) {
        setIsEditorFullscreen(false);
        return;
      }

      // Alt + Left: Previous Problem
      if (e.altKey && !e.ctrlKey && !e.shiftKey && e.key === "ArrowLeft") {
        e.preventDefault();
        navigateToPrevious();
        return;
      }

      // Alt + Right: Next Problem
      if (e.altKey && !e.ctrlKey && !e.shiftKey && e.key === "ArrowRight") {
        e.preventDefault();
        navigateToNext();
        return;
      }

      // Ctrl + Enter (outside Monaco focus or inside modal)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "Enter") {
        const targetTag = e.target?.tagName?.toLowerCase();
        if (targetTag !== "input" && targetTag !== "textarea") {
          e.preventDefault();
          handleRunRef.current?.();
        }
      }

      // Ctrl + Shift + Enter
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "Enter") {
        const targetTag = e.target?.tagName?.toLowerCase();
        if (targetTag !== "input" && targetTag !== "textarea") {
          e.preventDefault();
          handleSubmitRef.current?.();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isEditorFullscreen, navigateToPrevious, navigateToNext]);

  const getLanguageForMonaco = (language) => {
    return LANGUAGE_CONFIG[language].monacoLanguage;
  };

  const getSubmissionStatusText = (status) => {
    switch (status) {
      case "accepted":
        return "Accepted";

      case "wrongAnswer":
        return "Wrong Answer";

      case "compilationError":
        return "Compilation Error";

      case "runtimeError":
        return "Runtime Error";

      case "timeLimitExceeded":
        return "Time Limit Exceeded";

      case "pending":
        return "Pending";

      case "error":
        return "Error";

      default:
        return status || "Unknown";
    }
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (e) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const isDesktop = window.innerWidth >= 1024;

      let percentage;
      if (isDesktop) {
        percentage = ((e.clientX - rect.left) / rect.width) * 100;
        const minLeftPct = Math.max(25, (320 / rect.width) * 100);
        const maxLeftPct = Math.min(72, ((rect.width - 360) / rect.width) * 100);
        percentage = Math.max(minLeftPct, Math.min(maxLeftPct, percentage));
      } else {
        percentage = ((e.clientY - rect.top) / rect.height) * 100;
        percentage = Math.max(20, Math.min(80, percentage));
      }

      setLeftPanelSize(percentage);
      try {
        localStorage.setItem("problem-page-left-size", String(percentage));
      } catch {
        /* ignore */
      }
    };

    const handlePointerUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isResizing]);

  if (fetchingProblem) {
    return (
      <div className="min-h-screen bg-base-100 flex flex-col">
        <AppNav />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <span className="loading loading-spinner loading-lg text-primary mb-4" />
          <p className="text-sm font-medium tracking-tight text-base-content/65">
            Loading problem workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-base-100 flex flex-col">
        <AppNav />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-base-100 border border-base-300 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-base-content">
              Problem not found
            </h2>
            <p className="text-sm leading-relaxed text-base-content/65 mt-2">
              {problemError || "The requested problem could not be loaded."}
            </p>
            <NavLink
              to="/dsa"
              className="btn btn-primary btn-sm mt-6 h-9 min-h-9 rounded-lg font-semibold tracking-tight"
            >
              Back to DSA Sheet
            </NavLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-base-200 text-base-content overflow-hidden relative">
      <AppNav />

      {/* Mobile Top View Switcher (< lg) */}
      <div className="lg:hidden flex items-center justify-between px-3 py-2 bg-base-100 border-b border-base-300 shrink-0">
        <div className="inline-flex p-0.5 rounded-xl bg-base-200 w-full max-w-sm mx-auto">
          <button
            type="button"
            onClick={() => {
              setMobilePanel("problem");
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              mobilePanel === "problem"
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
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span>Problem</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMobilePanel("editor");
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              mobilePanel === "editor"
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
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            <span>Code & Console</span>
            {(runResult || submitResult) && (
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  runResult?.message === "accepted" ||
                  submitResult?.message === "accepted"
                    ? "bg-success"
                    : "bg-error"
                }`}
              />
            )}
          </button>
          {/* Mobile Board Switcher */}
          <button
            type="button"
            onClick={() => {
              setMobilePanel("board");
              setShowWhiteboardWindow(true);
              setTopWindow("whiteboard");
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              mobilePanel === "board" || (showWhiteboardWindow && topWindow === "whiteboard")
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
            <span>Board</span>
          </button>
        </div>
      </div>

      {/* Main Split-Pane Workspace */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden relative select-text"
        style={{
          userSelect: isResizing ? "none" : undefined,
        }}
      >
        {/* Left Panel: Docked Problem Statement */}
        <div
          className={`flex flex-col overflow-hidden bg-base-100 border-r border-base-300 min-h-0 min-w-0 select-text ${
            mobilePanel === "problem" ? "flex-1 w-full" : "hidden lg:flex"
          }`}
          style={{
            flexBasis: `${leftPanelSize}%`,
            flexShrink: 0,
          }}
        >
          <ProblemContent
            problem={problem}
            activeLeftTab={activeLeftTab}
            setActiveLeftTab={setActiveLeftTab}
            solved={solved}
            previousProblem={previousProblem}
            navigateToPrevious={navigateToPrevious}
            nextProblem={nextProblem}
            navigateToNext={navigateToNext}
            currentProblemIndex={currentProblemIndex}
            problemList={problemList}
            referenceSolution={referenceSolution}
            solutionMessage={solutionMessage}
            submissions={submissions}
            submissionLoading={submissionLoading}
            submissionError={submissionError}
            selectedSubmission={selectedSubmission}
            setSelectedSubmission={setSelectedSubmission}
            applyUsage={applyUsage}
          />
        </div>

        {/* Resizer Splitter Divider (Desktop only) */}
        <div
          onPointerDown={handleResizeStart}
          className="hidden lg:block w-1 h-full bg-base-300 hover:bg-primary/40 transition-colors duration-150 cursor-col-resize shrink-0 relative group touch-none"
        >
          <div className="absolute inset-0 -top-2 -bottom-2 -left-1 -right-1" />
        </div>

        {/* Right Panel: Monaco Editor & Console */}
        <div
          className={`flex flex-col overflow-hidden bg-base-100 min-h-0 min-w-0 select-text ${
            mobilePanel === "editor" ? "flex-1 w-full" : "hidden lg:flex"
          }`}
          style={{
            flexBasis: `${100 - leftPanelSize}%`,
            flexShrink: 0,
          }}
        >
          {/* Right Tabs Bar */}
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-base-300 bg-base-200/70 shrink-0 gap-1">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setActiveRightTab("code")}
                type="button"
                className={`h-8 px-3 rounded-md text-[13px] font-medium tracking-tight whitespace-nowrap transition-colors duration-150 ${
                  activeRightTab === "code"
                    ? "bg-base-100 text-base-content shadow-sm border border-base-300"
                    : "text-base-content/55 hover:text-base-content hover:bg-base-100/70 border border-transparent"
                }`}
              >
                Code
              </button>
              <button
                onClick={() => setActiveRightTab("testcase")}
                type="button"
                className={`h-8 px-3 rounded-md text-[13px] font-medium tracking-tight whitespace-nowrap transition-colors duration-150 ${
                  activeRightTab === "testcase"
                    ? "bg-base-100 text-base-content shadow-sm border border-base-300"
                    : "text-base-content/55 hover:text-base-content hover:bg-base-100/70 border border-transparent"
                }`}
              >
                Testcase
              </button>
              <button
                onClick={() => setActiveRightTab("result")}
                type="button"
                className={`h-8 px-3 rounded-md text-[13px] font-medium tracking-tight whitespace-nowrap transition-colors duration-150 ${
                  activeRightTab === "result"
                    ? "bg-base-100 text-base-content shadow-sm border border-base-300"
                    : "text-base-content/55 hover:text-base-content hover:bg-base-100/70 border border-transparent"
                }`}
              >
                Result
              </button>
            </div>

            <div className="flex items-center gap-1.5">

              {/* Whiteboard Window Toggle */}
              <button
                type="button"
                onClick={toggleWhiteboardWindow}
                className={`btn btn-xs h-8 px-2 sm:px-2.5 rounded-md border font-semibold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                  showWhiteboardWindow
                    ? "bg-primary text-primary-content border-primary shadow-xs"
                    : "bg-base-100 text-base-content/70 border-base-300 hover:bg-base-200"
                }`}
                title="Toggle Floating Whiteboard / Scratchpad"
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
                <span className="hidden sm:inline">Whiteboard</span>
                <span className="sm:hidden text-[11px]">Board</span>
              </button>

              {activeRightTab === "code" && (
                <div className="relative">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="h-8 px-2 sm:px-3 pr-7 sm:pr-8 rounded-md text-xs font-medium
                   bg-base-100 text-base-content
                   border border-base-300
                   outline-none cursor-pointer
                   hover:border-base-content/30
                   focus:border-primary
                   transition-colors"
                  >
                    {["javascript", "java", "cpp"].map((language) => (
                      <option key={language} value={language}>
                        {LANGUAGE_CONFIG[language].label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel Body */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {activeRightTab === "code" && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Monaco Editor Container */}
                <div
                  className={`${
                    isEditorFullscreen
                      ? "fixed inset-0 z-[90] bg-base-100 flex flex-col min-h-0 overflow-hidden"
                      : "flex-1 min-h-0 border-b border-base-300 relative flex flex-col"
                  }`}
                >
                  {isEditorFullscreen ? (
                    /* Fullscreen Top Header Toolbar */
                    <div className="h-12 px-2 sm:px-4 bg-base-200/90 border-b border-base-300 flex items-center justify-between gap-1.5 sm:gap-2 shrink-0 overflow-x-auto no-scrollbar">
                      {/* Left: Exit Fullscreen & Problem Info & Prev/Next */}
                      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsEditorFullscreen(false)}
                          className="btn btn-ghost btn-xs h-8 px-2 sm:px-2.5 rounded-lg border border-base-300 flex items-center gap-1.5 text-xs font-semibold text-base-content/80 hover:text-base-content shrink-0"
                          title="Exit Fullscreen (Esc)"
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
                          <span className="hidden sm:inline lg:hidden">
                            Exit
                          </span>
                          <span className="hidden lg:inline">
                            Exit Fullscreen
                          </span>
                          <kbd className="hidden xl:inline-block kbd kbd-xs text-[10px]">
                            Esc
                          </kbd>
                        </button>

                        <div className="h-4 w-px bg-base-300 hidden lg:block shrink-0" />

                        {/* Problem Title & Badge */}
                        <div className="hidden lg:flex items-center gap-2 min-w-0">
                          <span className="font-bold text-sm text-base-content truncate max-w-[150px] xl:max-w-xs">
                            {problem.title}
                          </span>
                          <div
                            className={`badge badge-xs sm:badge-sm font-semibold capitalize rounded-md shrink-0 ${
                              problem.difficulty === "easy"
                                ? "badge-success text-success-content"
                                : problem.difficulty === "medium"
                                  ? "badge-warning text-warning-content"
                                  : "badge-error text-error-content"
                            }`}
                          >
                            {problem.difficulty}
                          </div>
                        </div>

                        {/* Prev / Next buttons inside fullscreen */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={!previousProblem}
                            onClick={navigateToPrevious}
                            className="btn btn-ghost btn-xs h-7 px-1.5 sm:px-2 rounded-md border border-base-300/80 disabled:opacity-30 disabled:border-transparent flex items-center gap-1"
                            aria-label="Previous Problem"
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
                                strokeWidth="2.5"
                                d="M15 19l-7-7 7-7"
                              />
                            </svg>
                            <span className="hidden xl:inline text-xs">
                              Prev
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={!nextProblem}
                            onClick={navigateToNext}
                            className="btn btn-primary btn-xs h-7 px-1.5 sm:px-2.5 rounded-md flex items-center gap-1 disabled:opacity-30"
                            aria-label="Next Problem"
                          >
                            <span className="hidden xl:inline text-xs">
                              Next
                            </span>
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
                                strokeWidth="2.5"
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Right: Actions, Fullscreen 3-Column, Floating Board, Problem Panel Toggle, Run & Submit */}
                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        <select
                          value={selectedLanguage}
                          onChange={(e) => handleLanguageChange(e.target.value)}
                          className="h-8 px-1.5 sm:px-2 text-xs font-medium bg-base-100 text-base-content border border-base-300 rounded-md outline-none cursor-pointer focus:border-primary shrink-0"
                        >
                          {["javascript", "java", "cpp"].map((language) => (
                            <option key={language} value={language}>
                              {LANGUAGE_CONFIG[language].label}
                            </option>
                          ))}
                        </select>

                        {/* Copy Code */}
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="btn btn-ghost btn-xs h-8 px-2 rounded-lg border border-base-300 text-xs font-medium shrink-0 flex items-center gap-1"
                          title="Copy Code"
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
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="hidden md:inline">
                            {copied ? "Copied!" : "Copy"}
                          </span>
                        </button>

                        {/* Reset Code */}
                        <button
                          type="button"
                          onClick={() => setShowResetConfirm(true)}
                          className="btn btn-ghost btn-xs h-8 px-2 rounded-lg border border-base-300 text-xs font-medium shrink-0 flex items-center gap-1"
                          title="Reset Code"
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
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          <span className="hidden md:inline">Reset</span>
                        </button>

                        {/* Shortcuts modal button */}
                        <button
                          type="button"
                          onClick={() => setShowShortcutsModal(true)}
                          className="btn btn-ghost btn-xs h-8 px-2 rounded-lg border border-base-300 text-xs font-medium hidden sm:flex items-center gap-1 shrink-0"
                          title="View Keyboard Shortcuts"
                        >
                          <span>⌨</span>
                          <span className="hidden xl:inline">Shortcuts</span>
                        </button>

                        <div className="h-4 w-px bg-base-300 mx-0.5 hidden sm:block shrink-0" />

                        {/* Problem Window Toggle in Fullscreen */}
                        <button
                          type="button"
                          onClick={toggleProblemWindow}
                          className={`btn btn-xs h-8 px-2 sm:px-2.5 rounded-lg border font-semibold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                            showProblemWindow
                              ? "bg-primary text-primary-content border-primary shadow-xs"
                              : "bg-base-100 text-base-content/70 border-base-300 hover:bg-base-200"
                          }`}
                          title="Toggle Floating Problem Statement Panel"
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
                          <span className="hidden md:inline">Problem</span>
                          <span className="hidden sm:inline md:hidden text-[11px]">Problem</span>
                        </button>

                        {/* Whiteboard Window Toggle in Fullscreen */}
                        <button
                          type="button"
                          onClick={toggleWhiteboardWindow}
                          className={`btn btn-xs h-8 px-2 sm:px-2.5 rounded-lg border font-semibold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                            showWhiteboardWindow
                              ? "bg-primary text-primary-content border-primary shadow-xs"
                              : "bg-base-100 text-base-content/70 border-base-300 hover:bg-base-200"
                          }`}
                          title="Toggle Floating Whiteboard / Scratchpad"
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
                          <span className="hidden md:inline">Whiteboard</span>
                          <span className="hidden sm:inline md:hidden text-[11px]">Board</span>
                        </button>

                        {/* Run Button */}
                        <button
                          type="button"
                          onClick={handleRun}
                          disabled={runLoading || submitLoading}
                          className="btn btn-outline btn-xs h-8 px-2.5 sm:px-3 rounded-lg font-semibold flex items-center gap-1 shrink-0"
                        >
                          {runLoading ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            <>
                              <span>Run</span>
                              <kbd className="hidden xl:inline-block kbd kbd-xs text-[9px] bg-base-200">
                                Ctrl+↵
                              </kbd>
                            </>
                          )}
                        </button>

                        {/* Submit Button */}
                        <button
                          type="button"
                          onClick={handleSubmitCode}
                          disabled={runLoading || submitLoading}
                          className="btn btn-primary btn-xs h-8 px-2.5 sm:px-3 rounded-lg font-semibold flex items-center gap-1 shadow-xs shrink-0"
                        >
                          {submitLoading ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            <>
                              <span>Submit</span>
                              <kbd className="hidden xl:inline-block kbd kbd-xs text-[9px] bg-primary-content/20 text-primary-content">
                                Ctrl+⇧+↵
                              </kbd>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Editor Toolbar in Normal Mode - Sits above code, never overlaps lines */
                    <div className="px-2.5 sm:px-3 py-1 bg-base-200/60 border-b border-base-300/80 flex items-center justify-between gap-2 shrink-0 select-none">
                      {/* Left: Mobile Selection & Edit Helpers */}
                      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                        <span className="text-[11px] font-mono font-medium text-base-content/50 uppercase tracking-wider hidden sm:inline mr-1">
                          {selectedLanguage}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleSelectAllCode}
                            className="btn btn-ghost btn-xs h-6 px-2 rounded text-[11px] font-medium border border-base-300/80 hover:border-base-content/30"
                            title="Select All Code (Mobile & Desktop)"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={handleSelectLineCode}
                            className="btn btn-ghost btn-xs h-6 px-2 rounded text-[11px] font-medium border border-base-300/80 hover:border-base-content/30 hidden xs:inline-flex"
                            title="Select Current Line"
                          >
                            Line
                          </button>
                          <button
                            type="button"
                            onClick={handleUndoCode}
                            className="btn btn-ghost btn-xs h-6 px-1.5 rounded text-[11px] border border-base-300/80 hover:border-base-content/30"
                            title="Undo"
                          >
                            ↺
                          </button>
                          <button
                            type="button"
                            onClick={handleRedoCode}
                            className="btn btn-ghost btn-xs h-6 px-1.5 rounded text-[11px] border border-base-300/80 hover:border-base-content/30"
                            title="Redo"
                          >
                            ↻
                          </button>
                        </div>
                      </div>

                      {/* Right: Actions (Copy, Reset, Shortcuts, Fullscreen) */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Copy Button */}
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="btn btn-ghost btn-xs h-6 px-2 rounded-md border border-base-300/80 text-[11px] font-medium hover:border-base-content/30 shadow-2xs flex items-center gap-1"
                        >
                          {copied ? (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 text-success"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-success font-semibold">
                                Copied!
                              </span>
                            </>
                          ) : (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 text-base-content/60"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        {/* Reset Button */}
                        <button
                          type="button"
                          onClick={() => setShowResetConfirm(true)}
                          className="btn btn-ghost btn-xs h-6 px-2 rounded-md border border-base-300/80 text-[11px] font-medium hover:border-base-content/30 shadow-2xs flex items-center gap-1 text-base-content/70"
                          title="Reset Code"
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
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          <span className="hidden sm:inline">Reset</span>
                        </button>

                        {/* Shortcuts Button */}
                        <button
                          type="button"
                          onClick={() => setShowShortcutsModal(true)}
                          className="btn btn-ghost btn-xs h-6 px-1.5 rounded-md border border-base-300/80 text-[11px] font-medium hover:border-base-content/30 shadow-2xs text-base-content/70 hidden sm:flex items-center"
                          title="Keyboard Shortcuts"
                        >
                          <span>⌨</span>
                        </button>

                        {/* Fullscreen Button */}
                        <button
                          type="button"
                          onClick={() => setIsEditorFullscreen(true)}
                          className="btn btn-ghost btn-xs h-6 px-1.5 rounded-md border border-base-300/80 text-[11px] font-medium hover:border-base-content/30 shadow-2xs text-base-content/70"
                          title="Enter Fullscreen"
                          aria-label="Enter Fullscreen"
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
                              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Main Work Area: Monaco Editor */}
                  <div className="flex-1 flex min-h-0 overflow-hidden relative select-text">
                    {/* Monaco Editor Sub-container */}
                    <div className="h-full min-w-0 relative flex-1 select-text">
                      <Editor
                        height="100%"
                        language={getLanguageForMonaco(selectedLanguage)}
                        value={codes[selectedLanguage] || ""}
                        onChange={handleEditorChange}
                        onMount={handleEditorDidMount}
                        theme={isDark ? "vs-dark" : "light"}
                        options={{
                          fontSize: 14,
                          minimap: {
                            enabled: false,
                          },
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          tabSize: 2,
                          insertSpaces: true,
                          wordWrap: "on",
                          lineNumbers: "on",
                          glyphMargin: false,
                          folding: true,
                          lineDecorationsWidth: 12,
                          lineNumbersMinChars: 3,
                          renderLineHighlight: "line",
                          selectOnLineNumbers: true,
                          roundedSelection: false,
                          readOnly: false,
                          cursorStyle: "line",
                          mouseWheelZoom: true,
                          dragAndDrop: false,
                          contextmenu: true,
                          smoothScrolling: true,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action & Usage Controls Footer (Normal Mode) */}
                {!isEditorFullscreen && (
                  <div className="p-2 sm:p-3 bg-base-100 border-t border-base-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => setActiveRightTab("testcase")}
                        className="btn btn-ghost btn-xs h-8 min-h-8 px-2.5 rounded-md font-medium gap-1 text-base-content/60 hover:text-base-content shrink-0"
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
                            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Console
                      </button>

                      {usage && (
                        <span className="text-[11px] text-base-content/50 font-mono hidden md:inline-block truncate">
                          {usage.codeOperations?.unlimited
                            ? "Code: unlimited"
                            : `Code: ${usage.codeOperations?.used ?? 0}/${usage.codeOperations?.limit ?? 0}`}
                          {" • "}
                          {usage.gemini?.unlimited
                            ? "Gemini: unlimited"
                            : `Gemini: ${usage.gemini?.used ?? 0}/${usage.gemini?.limit ?? 0}`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 justify-end shrink-0 flex-wrap sm:flex-nowrap">
                      <button
                        type="button"
                        onClick={() => setShowShortcutsModal(true)}
                        className="btn btn-ghost btn-xs h-8 sm:h-9 px-2 rounded-lg border border-base-300 text-xs font-medium text-base-content/70 hover:text-base-content hidden xl:flex items-center gap-1 shrink-0"
                        title="Keyboard Shortcuts"
                      >
                        <span>⌨</span>
                        <span className="hidden sm:inline">Shortcuts</span>
                      </button>

                      <button
                        onClick={handleRun}
                        disabled={runLoading || submitLoading}
                        type="button"
                        className="btn btn-outline btn-sm h-8 sm:h-9 min-h-8 sm:min-h-9 px-2.5 sm:px-3 rounded-lg font-semibold tracking-tight flex items-center gap-1.5 shrink-0"
                      >
                        {runLoading ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <>
                            <span>Run</span>
                            <kbd className="hidden sm:inline-block kbd kbd-xs text-[10px] bg-base-200">
                              Ctrl+↵
                            </kbd>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleSubmitCode}
                        disabled={runLoading || submitLoading}
                        type="button"
                        className="btn btn-primary btn-sm h-8 sm:h-9 min-h-8 sm:min-h-9 px-3 sm:px-3.5 rounded-lg font-semibold tracking-tight shadow-sm flex items-center gap-1.5 shrink-0"
                      >
                        {submitLoading ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <>
                            <span>Submit</span>
                            <kbd className="hidden sm:inline-block kbd kbd-xs text-[10px] bg-primary-content/20 text-primary-content">
                              Ctrl+⇧+↵
                            </kbd>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeRightTab === "testcase" && (
              <div className="flex-1 overflow-y-auto p-5 sm:p-7 min-h-0 select-text">
                <div className="border-b border-base-300/70 pb-3.5 mb-5">
                  <h3 className="text-lg font-semibold tracking-tight text-base-content">
                    Test Execution Results
                  </h3>
                  <p className="text-[13px] text-base-content/55 mt-1 leading-relaxed">
                    Results from testing your code against the visible benchmark
                    test cases.
                  </p>
                </div>

                {runResult ? (
                  <div className="space-y-4">
                    {runResult.message === "accepted" ? (
                      <div className="rounded-xl border border-success/25 bg-success/5 p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-success/15 text-success flex items-center justify-center font-semibold">
                            ✓
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold tracking-tight text-success">
                              All visible test cases passed!
                            </h4>
                            <p className="text-[13px] text-base-content/65 mt-0.5 leading-relaxed">
                              Your solution produced the expected output across
                              all visible test cases.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-success/15 text-xs font-mono">
                          <span className="text-base-content/55">
                            Test Cases Passed:
                          </span>
                          <span className="font-semibold text-base-content">
                            {runResult.testCasesPassed} /{" "}
                            {runResult.testCasesTotal}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-error/25 bg-error/5 p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-error/15 text-error flex items-center justify-center font-semibold">
                            ✕
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold tracking-tight text-error">
                              {getSubmissionStatusText(runResult.message)}
                            </h4>
                            <p className="text-[13px] text-base-content/65 mt-0.5 leading-relaxed">
                              Your code could not pass all visible test cases.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-error/15 text-xs font-mono">
                          <div className="flex items-center gap-4">
                            <div>
                              <span className="text-base-content/50 block mb-0.5">
                                Test Cases
                              </span>
                              <span className="font-semibold text-base-content">
                                {runResult.testCasesPassed} /{" "}
                                {runResult.testCasesTotal}
                              </span>
                            </div>

                            {runResult.failedTestCase !== null && (
                              <div>
                                <span className="text-base-content/50 block mb-0.5">
                                  Failed Case #
                                </span>
                                <span className="font-semibold text-error">
                                  {runResult.failedTestCase}
                                </span>
                              </div>
                            )}
                          </div>

                          {runResult.expected !== null && (
                            <div>
                              <span className="text-[11px] text-base-content/55 block mb-1.5 font-semibold tracking-wide">
                                Expected Output
                              </span>
                              <pre className="p-3 rounded-lg bg-base-100 border border-base-300 overflow-x-auto text-[12.5px] leading-relaxed text-base-content select-text cursor-text">
                                {runResult.expected}
                              </pre>
                            </div>
                          )}

                          {runResult.actual !== null && (
                            <div>
                              <span className="text-[11px] text-base-content/55 block mb-1.5 font-semibold tracking-wide">
                                Your Output
                              </span>
                              <pre className="p-3 rounded-lg bg-base-100 border border-base-300 overflow-x-auto text-[12.5px] leading-relaxed text-base-content select-text cursor-text">
                                {runResult.actual}
                              </pre>
                            </div>
                          )}

                          {runResult.error && (
                            <div>
                              <span className="text-[11px] text-error block mb-1.5 font-semibold tracking-wide">
                                Error Trace
                              </span>
                              <pre className="p-3 rounded-lg bg-error/10 text-error border border-error/20 overflow-x-auto text-[12.5px] leading-relaxed select-text cursor-text">
                                {runResult.error}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16 px-4 rounded-xl border border-dashed border-base-300 bg-base-200/30">
                    <div className="w-10 h-10 rounded-xl bg-base-200 text-base-content/35 flex items-center justify-center mx-auto mb-2.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h4 className="text-sm font-semibold tracking-tight text-base-content">
                      No test results yet
                    </h4>
                    <p className="text-[13px] text-base-content/55 mt-1.5 max-w-sm mx-auto leading-relaxed">
                      Click <strong className="text-base-content">"Run"</strong>{" "}
                      in the code editor to execute your solution against
                      visible test cases.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeRightTab === "result" && (
              <div className="flex-1 overflow-y-auto p-5 sm:p-7 min-h-0 select-text">
                <div className="border-b border-base-300/70 pb-3.5 mb-5">
                  <h3 className="text-lg font-semibold tracking-tight text-base-content">
                    Comprehensive Submission Result
                  </h3>
                  <p className="text-[13px] text-base-content/55 mt-1 leading-relaxed">
                    Results from full evaluation across all hidden benchmark
                    test suites.
                  </p>
                </div>

                {submitResult ? (
                  <div className="space-y-4">
                    {submitResult.message === "accepted" ? (
                      <div className="rounded-xl border border-success/25 bg-success/5 p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-success/15 text-success flex items-center justify-center font-semibold">
                            ✓
                          </div>
                          <div>
                            <h4 className="text-base font-semibold tracking-tight text-success">
                              Accepted
                            </h4>
                            <p className="text-[13px] text-base-content/65 mt-0.5 leading-relaxed">
                              Congratulations! Your solution passed all visible
                              and hidden test cases.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-success/15">
                          <div className="p-3 bg-base-100 border border-base-300 rounded-xl">
                            <span className="text-[11px] font-semibold text-base-content/50 block mb-0.5 tracking-wide">
                              Test Cases
                            </span>
                            <span className="text-sm font-mono font-semibold text-base-content">
                              {submitResult.testCasesPassed} /{" "}
                              {submitResult.testCasesTotal}
                            </span>
                          </div>

                          {submitResult.submission?.time !== undefined && (
                            <div className="p-3 bg-base-100 border border-base-300 rounded-xl">
                              <span className="text-[11px] font-semibold text-base-content/50 block mb-0.5 tracking-wide">
                                Runtime
                              </span>
                              <span className="text-sm font-mono font-semibold text-base-content">
                                {submitResult.submission.time} sec
                              </span>
                            </div>
                          )}

                          {submitResult.submission?.memory !== undefined && (
                            <div className="p-3 bg-base-100 border border-base-300 rounded-xl">
                              <span className="text-[11px] font-semibold text-base-content/50 block mb-0.5 tracking-wide">
                                Memory
                              </span>
                              <span className="text-sm font-mono font-semibold text-base-content">
                                {submitResult.submission.memory} KB
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-error/25 bg-error/5 p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-error/15 text-error flex items-center justify-center font-semibold">
                            ✕
                          </div>
                          <div>
                            <h4 className="text-base font-semibold tracking-tight text-error">
                              {getSubmissionStatusText(submitResult.message)}
                            </h4>
                            <p className="text-[13px] text-base-content/65 mt-0.5 leading-relaxed">
                              Your solution failed evaluation requirements.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-error/15 text-xs font-mono">
                          {submitResult.testCasesPassed !== undefined && (
                            <div className="flex items-center gap-2">
                              <span className="text-base-content/50">
                                Test Cases Passed:
                              </span>
                              <span className="font-semibold text-base-content">
                                {submitResult.testCasesPassed} /{" "}
                                {submitResult.testCasesTotal}
                              </span>
                            </div>
                          )}

                          {submitResult.testCase != null && (
                            <div>
                              <span className="text-[11px] text-base-content/55 block mb-1.5 font-semibold tracking-wide">
                                Failed Test Case
                              </span>
                              <pre className="p-3 rounded-lg bg-base-100 border border-base-300 overflow-x-auto text-[12.5px] leading-relaxed text-base-content select-text cursor-text">
                                {submitResult.testCase}
                              </pre>
                            </div>
                          )}

                          {submitResult.error && (
                            <div>
                              <span className="text-[11px] text-error block mb-1.5 font-semibold tracking-wide">
                                Error Trace
                              </span>
                              <pre className="p-3 rounded-lg bg-error/10 text-error border border-error/20 overflow-x-auto text-[12.5px] leading-relaxed select-text cursor-text">
                                {submitResult.error}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16 px-4 rounded-xl border border-dashed border-base-300 bg-base-200/30">
                    <div className="w-10 h-10 rounded-xl bg-base-200 text-base-content/35 flex items-center justify-center mx-auto mb-2.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h4 className="text-sm font-semibold tracking-tight text-base-content">
                      No submission result yet
                    </h4>
                    <p className="text-[13px] text-base-content/55 mt-1.5 max-w-sm mx-auto leading-relaxed">
                      Click{" "}
                      <strong className="text-base-content">"Submit"</strong> in
                      the code editor to evaluate your code against all test
                      cases.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Floating Problem Statement Window */}
      {isEditorFullscreen && showProblemWindow && problem && (
        <FloatingWindow
          id="problem"
          title={problem.title}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 text-primary"
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
          }
          headerExtra={
            <span
              className={`badge badge-xs font-semibold capitalize rounded-md ${
                problem.difficulty === "easy"
                  ? "badge-success text-success-content"
                  : problem.difficulty === "medium"
                    ? "badge-warning text-warning-content"
                    : "badge-error text-error-content"
              }`}
            >
              {problem.difficulty}
            </span>
          }
          isOpen={showProblemWindow}
          onClose={() => {
            setShowProblemWindow(false);
            try {
              localStorage.setItem("problem-page-show-problem", "false");
            } catch {
              /* ignore */
            }
          }}
          isActive={topWindow === "problem"}
          onFocus={() => setTopWindow("problem")}
          defaultPos={{
            x: typeof window !== "undefined" ? Math.max(20, window.innerWidth - 560) : 20,
            y: 56,
            width: typeof window !== "undefined" ? Math.min(540, Math.max(340, window.innerWidth * 0.45)) : 520,
            height: typeof window !== "undefined" ? Math.min(680, window.innerHeight - 80) : 580,
          }}
          storageKey="floating-window-problem-fullscreen"
          minWidth={320}
          minHeight={260}
        >
          <ProblemContent
            problem={problem}
            activeLeftTab={activeLeftTab}
            setActiveLeftTab={setActiveLeftTab}
            solved={solved}
            previousProblem={previousProblem}
            navigateToPrevious={navigateToPrevious}
            nextProblem={nextProblem}
            navigateToNext={navigateToNext}
            currentProblemIndex={currentProblemIndex}
            problemList={problemList}
            referenceSolution={referenceSolution}
            solutionMessage={solutionMessage}
            submissions={submissions}
            submissionLoading={submissionLoading}
            submissionError={submissionError}
            selectedSubmission={selectedSubmission}
            setSelectedSubmission={setSelectedSubmission}
            applyUsage={applyUsage}
          />
        </FloatingWindow>
      )}

      {/* Floating Whiteboard Window */}
      <FloatingWindow
        id="whiteboard"
        title="Whiteboard Scratchpad"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5 text-primary"
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
        }
        isOpen={showWhiteboardWindow}
        onClose={() => {
          setShowWhiteboardWindow(false);
          try {
            localStorage.setItem("problem-page-show-whiteboard", "false");
          } catch {
            /* ignore */
          }
        }}
        isActive={topWindow === "whiteboard"}
        onFocus={() => setTopWindow("whiteboard")}
        defaultPos={{
          x: typeof window !== "undefined" ? Math.max(20, window.innerWidth - 560) : 700,
          y: 56,
          width: typeof window !== "undefined" ? Math.min(540, Math.max(340, window.innerWidth * 0.42)) : 480,
          height: typeof window !== "undefined" ? Math.min(680, window.innerHeight - 80) : 580,
        }}
        storageKey="floating-window-whiteboard"
        minWidth={320}
        minHeight={260}
      >
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <Whiteboard
            key={problemId}
            problemId={problemId}
            isDark={isDark}
            isFloating={true}
          />
        </div>
      </FloatingWindow>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowResetConfirm(false)}
          />

          <div className="relative w-full max-w-md rounded-2xl border border-base-300 bg-base-100 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-warning/10 text-warning mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v6h6M20 20v-6h-6M5.64 18.36A9 9 0 1018.36 5.64"
                  />
                </svg>
              </div>

              <h3 className="text-lg font-bold text-base-content">
                Reset Code?
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-base-content/65">
                Your current changes will be lost and the original starter code
                will be restored.
              </p>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="btn btn-sm btn-ghost"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleResetCode}
                  className="btn btn-sm btn-warning"
                >
                  Reset Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowShortcutsModal(false)}
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-base-300 bg-base-100 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3.5 border-b border-base-200 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">⌨</span>
                <h3 className="text-base font-bold text-base-content">
                  Coding & Navigation Shortcuts
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="btn btn-ghost btn-xs btn-circle text-base-content/60 hover:text-base-content"
                aria-label="Close shortcuts modal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1 text-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-base-content/50 pt-1 pb-0.5">
                Editor Code Editing
              </div>
              <div className="flex items-center justify-between py-2 border-b border-base-200/60">
                <span className="text-base-content/85 font-medium">
                  Duplicate / Copy Line Down
                </span>
                <div className="flex items-center gap-1">
                  <kbd className="kbd kbd-xs">Alt</kbd>+
                  <kbd className="kbd kbd-xs">Shift</kbd>+
                  <kbd className="kbd kbd-xs">↓</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-base-200/60">
                <span className="text-base-content/85 font-medium">
                  Duplicate / Copy Line Up
                </span>
                <div className="flex items-center gap-1">
                  <kbd className="kbd kbd-xs">Alt</kbd>+
                  <kbd className="kbd kbd-xs">Shift</kbd>+
                  <kbd className="kbd kbd-xs">↑</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-base-200/60">
                <span className="text-base-content/85 font-medium">
                  Move Line Down
                </span>
                <div className="flex items-center gap-1">
                  <kbd className="kbd kbd-xs">Alt</kbd>+
                  <kbd className="kbd kbd-xs">↓</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-base-200/60">
                <span className="text-base-content/85 font-medium">
                  Move Line Up
                </span>
                <div className="flex items-center gap-1">
                  <kbd className="kbd kbd-xs">Alt</kbd>+
                  <kbd className="kbd kbd-xs">↑</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-base-200/60">
                <span className="text-base-content/85 font-medium">
                  Toggle Line Comment
                </span>
                <div className="flex items-center gap-1">
                  <kbd className="kbd kbd-xs">Ctrl</kbd>+
                  <kbd className="kbd kbd-xs">/</kbd>
                </div>
              </div>

              <div className="text-[11px] font-bold uppercase tracking-wider text-base-content/50 pt-3 pb-0.5">
                Run, Submit & Navigation
              </div>
              <div className="flex items-center justify-between py-2 border-b border-base-200/60">
                <span className="text-base-content/85 font-medium">
                  Run Code
                </span>
                <div className="flex items-center gap-1">
                  <kbd className="kbd kbd-xs">Ctrl</kbd>+
                  <kbd className="kbd kbd-xs">↵</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-base-200/60">
                <span className="text-base-content/85 font-medium">
                  Submit Solution
                </span>
                <div className="flex items-center gap-1">
                  <kbd className="kbd kbd-xs">Ctrl</kbd>+
                  <kbd className="kbd kbd-xs">Shift</kbd>+
                  <kbd className="kbd kbd-xs">↵</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-base-200/60">
                <span className="text-base-content/85 font-medium">
                  Previous Problem
                </span>
                <div className="flex items-center gap-1">
                  <kbd className="kbd kbd-xs">Alt</kbd>+
                  <kbd className="kbd kbd-xs">←</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-base-200/60">
                <span className="text-base-content/85 font-medium">
                  Next Problem
                </span>
                <div className="flex items-center gap-1">
                  <kbd className="kbd kbd-xs">Alt</kbd>+
                  <kbd className="kbd kbd-xs">→</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-base-content/85 font-medium">
                  Exit Fullscreen
                </span>
                <div className="flex items-center gap-1">
                  <kbd className="kbd kbd-xs">Esc</kbd>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end pt-3 border-t border-base-200">
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="btn btn-sm btn-primary rounded-xl font-semibold px-5"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemPage;
