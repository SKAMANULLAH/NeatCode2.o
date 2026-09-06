import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { useParams, NavLink,useLocation, useNavigate  } from "react-router";
import axiosClient from "../utils/axiosClient";
import ChatAI from "../components/ChatAI";
import Editorial from "../components/Editorial.jsx";
import AppNav from "../components/AppNav";
import { useTheme } from "../context/ThemeContext";

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
  const [leftPanelSize, setLeftPanelSize] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);
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

  const editorRef = useRef(null);
const { problemId } = useParams();
const getCodeStorageKey = (language) => `problem-code-${problemId}-${language}`;
const { isDark } = useTheme();

const location = useLocation();
const navigate = useNavigate();

const problemList = location.state?.problems || [];

const currentProblemIndex = problemList.findIndex(
  (problem) => problem._id === problemId,
);

const previousProblem =
  currentProblemIndex > 0 ? problemList[currentProblemIndex - 1] : null;

const nextProblem =
  currentProblemIndex >= 0 && currentProblemIndex < problemList.length - 1
    ? problemList[currentProblemIndex + 1]
    : null;

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setFetchingProblem(true);
        setProblemError("");

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
  const savedCode = localStorage.getItem(getCodeStorageKey(language));

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

  localStorage.setItem(getCodeStorageKey(selectedLanguage), newCode);
};
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
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

  localStorage.removeItem(getCodeStorageKey(selectedLanguage));

  setShowResetConfirm(false);
};

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
  };

  const handleRun = async () => {
    setRunLoading(true);
    setRunResult(null);

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
    } finally {
      setRunLoading(false);
    }
  };

  const handleSubmitCode = async () => {
    setSubmitLoading(true);
    setSubmitResult(null);

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
    } finally {
      setSubmitLoading(false);
    }
  };

  const getLanguageForMonaco = (language) => {
    return LANGUAGE_CONFIG[language].monacoLanguage;
  };

  const getDifficultyBadgeColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "badge-success";

      case "medium":
        return "badge-warning";

      case "hard":
        return "badge-error";

      default:
        return "badge-neutral";
    }
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

  const getSubmissionBadge = (status) => {
    switch (status) {
      case "accepted":
        return "badge-success";

      case "pending":
        return "badge-warning";

      default:
        return "badge-error";
    }
  };

  const formatMemory = (memory) => {
    if (memory === undefined || memory === null) return "N/A";

    const numericMemory = Number(memory);

    if (Number.isNaN(numericMemory)) return memory;

    if (numericMemory < 1024) return `${numericMemory} KB`;

    return `${(numericMemory / 1024).toFixed(2)} MB`;
  };

  const formatSubmissionDate = (dateString) => {
    if (!dateString) return "N/A";

    return new Date(dateString).toLocaleString();
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
      } else {
        percentage = ((e.clientY - rect.top) / rect.height) * 100;
      }

      percentage = Math.max(20, Math.min(80, percentage));

      setLeftPanelSize(percentage);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
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
    <div className="h-screen flex flex-col bg-base-200 text-base-content overflow-hidden">
      <AppNav />

      {/* Main Split-Pane Workspace */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden relative"
        style={{
          userSelect: isResizing ? "none" : undefined,
        }}
      >
        {/* Left Panel */}
        <div
          className="flex flex-col overflow-hidden bg-base-100 border-r border-base-300 min-h-0 min-w-0"
          style={{
            flexBasis: `${leftPanelSize}%`,
            flexShrink: 0,
          }}
        >
          {/* Left Tabs Bar */}
          <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-base-300 bg-base-200/70 shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveLeftTab("description")}
              type="button"
              className={`h-8 px-3 rounded-md text-[13px] font-medium tracking-tight whitespace-nowrap transition-colors duration-150 ${
                activeLeftTab === "description"
                  ? "bg-base-100 text-base-content shadow-sm border border-base-300"
                  : "text-base-content/55 hover:text-base-content hover:bg-base-100/70 border border-transparent"
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveLeftTab("editorial")}
              type="button"
              className={`h-8 px-3 rounded-md text-[13px] font-medium tracking-tight whitespace-nowrap transition-colors duration-150 ${
                activeLeftTab === "editorial"
                  ? "bg-base-100 text-base-content shadow-sm border border-base-300"
                  : "text-base-content/55 hover:text-base-content hover:bg-base-100/70 border border-transparent"
              }`}
            >
              Editorial
            </button>
            <button
              onClick={() => setActiveLeftTab("solutions")}
              type="button"
              className={`h-8 px-3 rounded-md text-[13px] font-medium tracking-tight whitespace-nowrap transition-colors duration-150 ${
                activeLeftTab === "solutions"
                  ? "bg-base-100 text-base-content shadow-sm border border-base-300"
                  : "text-base-content/55 hover:text-base-content hover:bg-base-100/70 border border-transparent"
              }`}
            >
              Solutions
            </button>
            <button
              onClick={() => setActiveLeftTab("submissions")}
              type="button"
              className={`h-8 px-3 rounded-md text-[13px] font-medium tracking-tight whitespace-nowrap transition-colors duration-150 ${
                activeLeftTab === "submissions"
                  ? "bg-base-100 text-base-content shadow-sm border border-base-300"
                  : "text-base-content/55 hover:text-base-content hover:bg-base-100/70 border border-transparent"
              }`}
            >
              Submissions
            </button>
            <button
              onClick={() => setActiveLeftTab("chatAI")}
              type="button"
              className={`h-8 px-3 rounded-md text-[13px] font-medium tracking-tight whitespace-nowrap inline-flex items-center gap-1.5 transition-colors duration-150 ${
                activeLeftTab === "chatAI"
                  ? "bg-base-100 text-base-content shadow-sm border border-base-300"
                  : "text-base-content/55 hover:text-base-content hover:bg-base-100/70 border border-transparent"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              ChatAI
            </button>
          </div>

          {/* Left Panel Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 min-h-0">
            {activeLeftTab === "description" && (
              <div className="space-y-7">
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-[11px] font-semibold text-base-content/45 uppercase tracking-[0.14em]">
                      Problem
                    </span>
                    {solved && (
                      <span className="badge badge-xs badge-primary font-semibold rounded-md">
                        Solved
                      </span>
                    )}
                  </div>
                  <h1 className="text-[1.65rem] leading-tight font-semibold tracking-tight text-base-content">
                    {problem.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-1.5 mt-3.5">
                    <div
                      title={getDifficultyBadgeColor(problem.difficulty)}
                      className={`badge badge-sm font-semibold capitalize rounded-md ${
                        problem.difficulty === "easy"
                          ? "badge-success text-success-content"
                          : problem.difficulty === "medium"
                            ? "badge-warning text-warning-content"
                            : "badge-error text-error-content"
                      }`}
                    >
                      {problem.difficulty}
                    </div>

                    {Array.isArray(problem.tags)
                      ? problem.tags.map((tag, index) => (
                          <div
                            key={index}
                            className="badge badge-sm badge-ghost border-base-300 text-base-content/65 font-medium rounded-md"
                          >
                            {tag}
                          </div>
                        ))
                      : problem.tags && (
                          <div className="badge badge-sm badge-ghost border-base-300 text-base-content/65 font-medium rounded-md">
                            {problem.tags}
                          </div>
                        )}
                  </div>
                  <div className="flex items-center justify-between gap-3 mt-5">
                    <button
                      type="button"
                      disabled={!previousProblem}
                      onClick={() =>
                        previousProblem &&
                        navigate(`/problem/${previousProblem._id}`, {
                          state: { problems: problemList },
                        })
                      }
                      className="btn btn-sm btn-ghost border border-base-300"
                    >
                      ← Previous
                    </button>

                    <button
                      type="button"
                      disabled={!nextProblem}
                      onClick={() =>
                        nextProblem &&
                        navigate(`/problem/${nextProblem._id}`, {
                          state: { problems: problemList },
                        })
                      }
                      className="btn btn-sm btn-primary"
                    >
                      Next →
                    </button>
                  </div>
                </div>

                <div className="max-w-none text-[15px] leading-[1.75] text-base-content/80 whitespace-pre-line border-t border-base-300/70 pt-5">
                  {problem.description}
                </div>

                <div className="border-t border-base-300/70 pt-5">
                  <h3 className="text-[11px] font-semibold text-base-content/50 uppercase tracking-[0.14em] mb-4">
                    Examples
                  </h3>

                  <div className="space-y-4">
                    {problem.visibleTestCases?.map((example, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-base-300 bg-base-200/40 p-4 space-y-3"
                      >
                        <h4 className="text-[11px] font-semibold text-base-content flex items-center gap-1.5 uppercase tracking-[0.12em]">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Example {index + 1}
                        </h4>

                        <div className="space-y-3 text-xs">
                          <div>
                            <strong className="text-[11px] font-semibold text-base-content/55 block mb-1.5 tracking-wide">
                              Input
                            </strong>
                            <pre className="p-3 rounded-lg bg-base-100 border border-base-300 font-mono text-[12.5px] leading-relaxed overflow-x-auto text-base-content">
                              {example.input}
                            </pre>
                          </div>

                          <div>
                            <strong className="text-[11px] font-semibold text-base-content/55 block mb-1.5 tracking-wide">
                              Output
                            </strong>
                            <pre className="p-3 rounded-lg bg-base-100 border border-base-300 font-mono text-[12.5px] leading-relaxed overflow-x-auto text-base-content">
                              {example.output}
                            </pre>
                          </div>

                          {example.explanation && (
                            <div>
                              <strong className="text-[11px] font-semibold text-base-content/55 block mb-1 tracking-wide">
                                Explanation
                              </strong>
                              <p className="text-base-content/75 text-[13px] leading-relaxed">
                                {example.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeLeftTab === "editorial" && (
              <div className="space-y-4">
                <div className="border-b border-base-300/70 pb-3.5">
                  <h2 className="text-lg font-semibold tracking-tight text-base-content">
                    Video Editorial
                  </h2>
                  <p className="text-[13px] text-base-content/55 mt-1 leading-relaxed">
                    Watch the author's explanation and conceptual breakdown.
                  </p>
                </div>

                <div>
                  {problem.videoUrl ? (
                    <Editorial videoUrl={problem.videoUrl} />
                  ) : (
                    <div className="text-center py-12 rounded-xl border border-dashed border-base-300 bg-base-200/30">
                      <p className="text-sm font-medium text-base-content/65">
                        No editorial is available for this problem.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeLeftTab === "solutions" && (
              <div className="space-y-4">
                <div className="border-b border-base-300/70 pb-3.5">
                  <h2 className="text-lg font-semibold tracking-tight text-base-content">
                    Official Reference Solutions
                  </h2>
                  <p className="text-[13px] text-base-content/55 mt-1 leading-relaxed">
                    Verified canonical implementations across supported
                    languages.
                  </p>
                </div>

                {referenceSolution.length > 0 ? (
                  <div className="space-y-4">
                    {referenceSolution.map((solution, index) => (
                      <div
                        key={solution._id || index}
                        className="rounded-xl border border-base-300 bg-base-200/20 overflow-hidden"
                      >
                        <div className="px-4 py-2.5 bg-base-200/60 border-b border-base-300 flex items-center justify-between">
                          <h3 className="text-[13px] font-semibold tracking-tight text-base-content">
                            {problem.title}
                          </h3>
                          <span className="badge badge-primary badge-sm font-mono font-semibold rounded-md">
                            {solution.language}
                          </span>
                        </div>
                        <pre className="p-4 text-[12.5px] font-mono overflow-x-auto leading-relaxed bg-base-100 text-base-content">
                          <code>{solution.completeCode}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 px-4 rounded-xl border border-dashed border-base-300 bg-base-200/30">
                    <p className="text-sm font-medium text-base-content/65">
                      {solutionMessage ||
                        (solved
                          ? "No official solution is available for this problem."
                          : "You can only see the solution after solving this problem.")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeLeftTab === "submissions" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-base-300/70 pb-3.5">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-base-content">
                      Submission History
                    </h2>
                    <p className="text-[13px] text-base-content/55 mt-1 leading-relaxed">
                      Your historical test and evaluation runs.
                    </p>
                  </div>
                  {submissions.length > 0 && (
                    <div className="badge badge-ghost border-base-300 text-[11px] font-semibold rounded-md">
                      {submissions.length} total
                    </div>
                  )}
                </div>

                {submissionLoading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <span className="loading loading-spinner loading-md text-primary mb-2" />
                    <p className="text-xs text-base-content/60">
                      Loading submissions...
                    </p>
                  </div>
                )}

                {!submissionLoading && submissionError && (
                  <div className="alert alert-error text-xs rounded-xl">
                    <span>{submissionError}</span>
                  </div>
                )}

                {!submissionLoading &&
                  !submissionError &&
                  submissions.length === 0 && (
                    <div className="text-center py-12 rounded-xl border border-dashed border-base-300 bg-base-200/30">
                      <p className="text-sm font-medium text-base-content/65">
                        No submissions found for this problem.
                      </p>
                    </div>
                  )}

                {!submissionLoading &&
                  !submissionError &&
                  submissions.length > 0 && (
                    <>
                      <div className="overflow-x-auto border border-base-300 rounded-xl bg-base-100">
                        <table className="table table-xs w-full">
                          <thead>
                            <tr className="bg-base-200/70 text-base-content/50 text-[11px] uppercase tracking-[0.08em]">
                              <th>#</th>
                              <th>Language</th>
                              <th>Status</th>
                              <th>Runtime</th>
                              <th>Memory</th>
                              <th>Test Cases</th>
                              <th>Submitted</th>
                              <th className="text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {submissions.map((submission, index) => (
                              <tr
                                key={submission._id || index}
                                className="hover:bg-base-200/50 transition-colors"
                              >
                                <td className="font-mono font-medium text-base-content/60">
                                  {submissions.length - index}
                                </td>
                                <td className="font-mono font-semibold">
                                  {submission.language || "N/A"}
                                </td>
                                <td>
                                  <span
                                    title={getSubmissionBadge(
                                      submission.status,
                                    )}
                                    className={`badge badge-xs font-semibold capitalize rounded-md ${
                                      submission.status === "accepted"
                                        ? "badge-success text-success-content"
                                        : submission.status === "pending"
                                          ? "badge-warning text-warning-content"
                                          : "badge-error text-error-content"
                                    }`}
                                  >
                                    {getSubmissionStatusText(submission.status)}
                                  </span>
                                </td>
                                <td className="font-mono text-xs text-base-content/80">
                                  {submission.time ??
                                    submission.runtime ??
                                    "N/A"}{" "}
                                  sec
                                </td>
                                <td className="font-mono text-xs text-base-content/80">
                                  {formatMemory(submission.memory)}
                                </td>
                                <td className="font-mono text-xs text-base-content/80">
                                  {submission.testCasesPassed ?? 0}/
                                  {submission.testCasesTotal ?? 0}
                                </td>
                                <td className="text-xs text-base-content/55">
                                  {formatSubmissionDate(submission.createdAt)}
                                </td>
                                <td className="text-right">
                                  <button
                                    className="btn btn-ghost btn-xs text-primary hover:bg-primary/10 font-semibold rounded-md"
                                    onClick={() =>
                                      setSelectedSubmission(submission)
                                    }
                                  >
                                    Code
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                {/* Submission Code Modal */}
                {selectedSubmission && (
                  <div
                    className="modal modal-open"
                    role="dialog"
                    aria-modal="true"
                  >
                    <div className="modal-box max-w-2xl bg-base-100 border border-base-300 rounded-2xl shadow-xl p-6">
                      <div className="flex items-center justify-between border-b border-base-300 pb-3.5 mb-4">
                        <div>
                          <h3 className="text-base font-semibold tracking-tight text-base-content">
                            Submission Details
                          </h3>
                          <p className="text-[11px] font-mono text-base-content/55 uppercase tracking-wide mt-1">
                            Language: {selectedSubmission.language || "N/A"}
                          </p>
                        </div>
                        <button
                          className="btn btn-sm btn-circle btn-ghost"
                          onClick={() => setSelectedSubmission(null)}
                          aria-label="Close submission details"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div className="flex flex-wrap items-center gap-2 p-3 bg-base-200/50 rounded-xl border border-base-300">
                          <span
                            title={getSubmissionBadge(
                              selectedSubmission.status,
                            )}
                            className={`badge badge-sm font-semibold capitalize rounded-md ${
                              selectedSubmission.status === "accepted"
                                ? "badge-success text-success-content"
                                : selectedSubmission.status === "pending"
                                  ? "badge-warning text-warning-content"
                                  : "badge-error text-error-content"
                            }`}
                          >
                            {getSubmissionStatusText(selectedSubmission.status)}
                          </span>
                          <span className="font-mono">
                            Runtime:{" "}
                            {selectedSubmission.time ??
                              selectedSubmission.runtime ??
                              "N/A"}{" "}
                            sec
                          </span>
                          <span>•</span>
                          <span className="font-mono">
                            Memory: {formatMemory(selectedSubmission.memory)}
                          </span>
                          <span>•</span>
                          <span className="font-mono">
                            Passed: {selectedSubmission.testCasesPassed ?? 0}/
                            {selectedSubmission.testCasesTotal ?? 0}
                          </span>
                        </div>

                        {selectedSubmission.errorMessage && (
                          <div>
                            <h4 className="font-bold text-error mb-1">
                              Execution Error
                            </h4>
                            <pre className="p-3 bg-error/10 text-error border border-error/20 rounded-xl font-mono text-[12.5px] overflow-x-auto leading-relaxed">
                              {selectedSubmission.errorMessage}
                            </pre>
                          </div>
                        )}

                        <div>
                          <p className="font-semibold tracking-tight text-base-content mb-1.5">
                            Submitted Code
                          </p>
                          <pre className="p-4 bg-base-200/60 border border-base-300 rounded-xl font-mono text-[12.5px] overflow-x-auto leading-relaxed max-h-96">
                            <code>
                              {selectedSubmission.code ||
                                "Submitted code is not available."}
                            </code>
                          </pre>
                        </div>
                      </div>

                      <div className="modal-action mt-6 pt-3 border-t border-base-300">
                        <button
                          className="btn btn-sm btn-ghost font-medium rounded-lg"
                          onClick={() => setSelectedSubmission(null)}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                    <div
                      className="modal-backdrop bg-black/40 backdrop-blur-[2px]"
                      onClick={() => setSelectedSubmission(null)}
                    >
                      <button aria-label="Close">close</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeLeftTab === "chatAI" && (
              <div className="space-y-4 h-full flex flex-col">
                <div className="border-b border-base-300/70 pb-3.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-tight text-base-content">
                      AI Mentor Assistant
                    </h2>
                    <span className="badge badge-primary badge-xs rounded-md">
                      Active
                    </span>
                  </div>
                  <p className="text-[13px] text-base-content/55 mt-1 leading-relaxed">
                    Ask for conceptual hints, edge cases, and asymptotic
                    complexity walk-throughs without spoilers.
                  </p>
                </div>

                <div className="flex-1 min-h-0">
                  <ChatAI problem={problem} onUsageUpdate={applyUsage} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resizer Splitter Divider */}
        <div
          onPointerDown={handleResizeStart}
          className="w-full lg:w-1 h-2 lg:h-full bg-base-300 hover:bg-primary/40 transition-colors duration-150 cursor-row-resize lg:cursor-col-resize shrink-0 relative group touch-none"
        >
          <div className="absolute inset-0 -top-2 -bottom-2 -left-1 -right-1" />
        </div>

        {/* Right Panel */}
        <div
          className="flex flex-col overflow-hidden bg-base-100 min-h-0 min-w-0"
          style={{
            flexBasis: `${100 - leftPanelSize}%`,
            flexShrink: 0,
          }}
        >
          {/* Right Tabs Bar */}
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-base-300 bg-base-200/70 shrink-0">
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

            {activeRightTab === "code" && (
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="h-8 px-3 pr-8 rounded-md text-xs font-medium
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

          {/* Right Panel Body */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {activeRightTab === "code" && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Monaco Editor Container */}
                <div
                  className={`${
                    isEditorFullscreen
                      ? "fixed inset-0 z-[90] bg-base-100"
                      : "flex-1 min-h-0 border-b border-base-300 relative"
                  }`}
                >
                  <div className="absolute top-3 right-3 z-10 flex gap-2">
                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="h-8 px-3 rounded-md bg-base-100/90 border border-base-300 text-xs font-medium hover:bg-base-200 shadow-sm"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>

                    {/* Reset Button */}
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="h-8 px-3 rounded-md bg-base-100/90 border border-base-300 text-xs font-medium hover:bg-base-200 shadow-sm"
                    >
                      Reset
                    </button>

                    {/* Fullscreen Button */}
                    <button
                      type="button"
                      onClick={() => setIsEditorFullscreen((prev) => !prev)}
                      className="h-8 px-3 rounded-md bg-base-100/90 border border-base-300 text-xs font-medium hover:bg-base-200 shadow-sm"
                      title={
                        isEditorFullscreen ? "Exit fullscreen" : "Fullscreen"
                      }
                      aria-label={
                        isEditorFullscreen ? "Exit fullscreen" : "Fullscreen"
                      }
                    >
                      {isEditorFullscreen ? "↙" : "⛶"}
                    </button>
                  </div>

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
                      lineDecorationsWidth: 10,
                      lineNumbersMinChars: 3,
                      renderLineHighlight: "line",
                      selectOnLineNumbers: true,
                      roundedSelection: false,
                      readOnly: false,
                      cursorStyle: "line",
                      mouseWheelZoom: true,
                    }}
                  />
                </div>

                {/* Action & Usage Controls Footer */}
                <div className="p-3 bg-base-100 border-t border-base-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveRightTab("testcase")}
                      className="btn btn-ghost btn-xs h-8 min-h-8 px-2.5 rounded-md font-medium gap-1 text-base-content/60 hover:text-base-content"
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
                      <span className="text-[11px] text-base-content/50 font-mono hidden md:inline-block">
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
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={handleRun}
                      disabled={runLoading || submitLoading}
                      type="button"
                      className="btn btn-outline btn-sm h-9 min-h-9 min-w-[88px] rounded-lg font-semibold tracking-tight"
                    >
                      {runLoading ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        "Run"
                      )}
                    </button>

                    <button
                      onClick={handleSubmitCode}
                      disabled={runLoading || submitLoading}
                      type="button"
                      className="btn btn-primary btn-sm h-9 min-h-9 min-w-[96px] rounded-lg font-semibold tracking-tight shadow-sm"
                    >
                      {submitLoading ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        "Submit"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeRightTab === "testcase" && (
              <div className="flex-1 overflow-y-auto p-5 sm:p-7 min-h-0">
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
                              <pre className="p-3 rounded-lg bg-base-100 border border-base-300 overflow-x-auto text-[12.5px] leading-relaxed text-base-content">
                                {runResult.expected}
                              </pre>
                            </div>
                          )}

                          {runResult.actual !== null && (
                            <div>
                              <span className="text-[11px] text-base-content/55 block mb-1.5 font-semibold tracking-wide">
                                Your Output
                              </span>
                              <pre className="p-3 rounded-lg bg-base-100 border border-base-300 overflow-x-auto text-[12.5px] leading-relaxed text-base-content">
                                {runResult.actual}
                              </pre>
                            </div>
                          )}

                          {runResult.error && (
                            <div>
                              <span className="text-[11px] text-error block mb-1.5 font-semibold tracking-wide">
                                Error Trace
                              </span>
                              <pre className="p-3 rounded-lg bg-error/10 text-error border border-error/20 overflow-x-auto text-[12.5px] leading-relaxed">
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
              <div className="flex-1 overflow-y-auto p-5 sm:p-7 min-h-0">
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
                              <pre className="p-3 rounded-lg bg-base-100 border border-base-300 overflow-x-auto text-[12.5px] leading-relaxed text-base-content">
                                {submitResult.testCase}
                              </pre>
                            </div>
                          )}

                          {submitResult.error && (
                            <div>
                              <span className="text-[11px] text-error block mb-1.5 font-semibold tracking-wide">
                                Error Trace
                              </span>
                              <pre className="p-3 rounded-lg bg-error/10 text-error border border-error/20 overflow-x-auto text-[12.5px] leading-relaxed">
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
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowResetConfirm(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md rounded-2xl border border-base-300 bg-base-100 shadow-2xl">
            <div className="p-6">
              {/* Icon */}
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

              {/* Title */}
              <h3 className="text-lg font-bold text-base-content">
                Reset Code?
              </h3>

              {/* Message */}
              <p className="mt-2 text-sm leading-relaxed text-base-content/65">
                Your current changes will be lost and the original starter code
                will be restored.
              </p>

              {/* Buttons */}
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
    </div>
  );
};

export default ProblemPage;
