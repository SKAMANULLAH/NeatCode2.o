import Editorial from "./Editorial";
import ChatAI from "./ChatAI";

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

const ProblemContent = ({
  problem,
  activeLeftTab,
  setActiveLeftTab,
  solved,
  previousProblem,
  navigateToPrevious,
  nextProblem,
  navigateToNext,
  currentProblemIndex = -1,
  problemList = [],
  referenceSolution = [],
  solutionMessage = "",
  submissions = [],
  submissionLoading = false,
  submissionError = "",
  selectedSubmission = null,
  setSelectedSubmission,
  applyUsage,
}) => {
  if (!problem) return null;

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden bg-base-100 select-text">
      {/* Left Tabs Bar */}
      <div className="flex items-center justify-between gap-1 px-2 py-1.5 border-b border-base-300 bg-base-200/70 shrink-0">
        <div className="flex items-center gap-0.5 overflow-x-auto min-w-0">
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

        {/* Universal Next / Previous Navigation Controls */}
        <div className="flex items-center gap-1 shrink-0 ml-auto pl-2">
          <button
            type="button"
            disabled={!previousProblem}
            onClick={navigateToPrevious}
            className="btn btn-ghost btn-xs h-7 px-2 rounded-md font-medium border border-base-300/80 disabled:opacity-30 disabled:border-transparent flex items-center gap-1 hover:border-base-content/30"
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
            <span className="hidden sm:inline text-xs">Prev</span>
          </button>

          {problemList.length > 0 && currentProblemIndex >= 0 && (
            <span className="text-[11px] font-mono font-medium text-base-content/50 px-1 hidden md:inline">
              {currentProblemIndex + 1}/{problemList.length}
            </span>
          )}

          <button
            type="button"
            disabled={!nextProblem}
            onClick={navigateToNext}
            className="btn btn-primary btn-xs h-7 px-2.5 rounded-md font-medium flex items-center gap-1 disabled:opacity-30 shadow-xs"
            aria-label="Next Problem"
          >
            <span className="hidden sm:inline text-xs">Next</span>
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
                        <pre className="p-3 rounded-lg bg-base-100 border border-base-300 font-mono text-[12.5px] leading-relaxed overflow-x-auto text-base-content select-text cursor-text">
                          {example.input}
                        </pre>
                      </div>

                      <div>
                        <strong className="text-[11px] font-semibold text-base-content/55 block mb-1.5 tracking-wide">
                          Output
                        </strong>
                        <pre className="p-3 rounded-lg bg-base-100 border border-base-300 font-mono text-[12.5px] leading-relaxed overflow-x-auto text-base-content select-text cursor-text">
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
                    <pre className="p-4 text-[12.5px] font-mono overflow-x-auto leading-relaxed bg-base-100 text-base-content select-text cursor-text">
                      <code className="select-text cursor-text">{solution.completeCode}</code>
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
                        <pre className="p-3 bg-error/10 text-error border border-error/20 rounded-xl font-mono text-[12.5px] overflow-x-auto leading-relaxed select-text cursor-text">
                          {selectedSubmission.errorMessage}
                        </pre>
                      </div>
                    )}

                    <div>
                      <p className="font-semibold tracking-tight text-base-content mb-1.5">
                        Submitted Code
                      </p>
                      <pre className="p-4 bg-base-200/60 border border-base-300 rounded-xl font-mono text-[12.5px] overflow-x-auto leading-relaxed max-h-96 select-text cursor-text">
                        <code className="select-text cursor-text">
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
  );
};

export default ProblemContent;
