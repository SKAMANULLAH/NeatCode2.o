import { useState, useEffect } from "react";
import axiosClient from "../utils/axiosClient";

const SubmissionHistory = ({ problemId }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(
          `/problem/fetchProblemSubmission/${problemId}`,
        );
        setSubmissions(Array.isArray(response.data) ? response.data : []);
        setError(null);
      } catch (err) {
        setError("Failed to fetch submission history");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (problemId) {
      fetchSubmissions();
    }
  }, [problemId]);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "badge-success text-success-content";
      case "wrong":
      case "wronganswer":
      case "wrong_answer":
        return "badge-error text-error-content";
      case "error":
      case "runtimeerror":
      case "compilationerror":
        return "badge-warning text-warning-content";
      case "pending":
        return "badge-info text-info-content";
      default:
        return "badge-neutral text-neutral-content";
    }
  };

  const formatMemory = (memory) => {
    if (memory === undefined || memory === null) return "N/A";
    const numericMemory = Number(memory);
    if (Number.isNaN(numericMemory)) return memory;
    if (numericMemory < 1024) return `${numericMemory} kB`;
    return `${(numericMemory / 1024).toFixed(2)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="loading loading-spinner loading-md text-primary mb-3" />
        <p className="text-xs font-medium text-base-content/60">
          Loading submission history...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error text-xs rounded-xl shadow-xs my-4 flex items-center gap-2.5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="stroke-current shrink-0 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Strip */}
      <div className="flex items-center justify-between border-b border-base-300/60 pb-3">
        <div>
          <h2 className="text-base font-semibold text-base-content tracking-tight">
            Submission History
          </h2>
          <p className="text-xs text-base-content/60 mt-0.5">
            View evaluation logs, runtimes, and submitted solutions.
          </p>
        </div>
        {submissions.length > 0 && (
          <span className="badge badge-sm badge-ghost border-base-300 font-mono text-[11px] text-base-content/70">
            {submissions.length} {submissions.length === 1 ? "run" : "runs"}
          </span>
        )}
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-14 px-4 rounded-2xl border border-dashed border-base-300 bg-base-200/20">
          <div className="w-10 h-10 rounded-xl bg-base-200 text-base-content/40 flex items-center justify-center mx-auto mb-2.5">
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <p className="text-xs font-semibold text-base-content">
            No submissions found
          </p>
          <p className="text-[11px] text-base-content/50 mt-0.5">
            Submit your solution to generate test benchmarks.
          </p>
        </div>
      ) : (
        <>
          {/* Submissions Table Card */}
          <div className="overflow-x-auto border border-base-300 rounded-xl bg-base-100">
            <table className="table table-xs w-full">
              <thead>
                <tr className="bg-base-200/70 text-base-content/50 text-[11px] uppercase tracking-[0.08em]">
                  <th className="w-10 text-center">#</th>
                  <th>Language</th>
                  <th>Status</th>
                  <th>Runtime</th>
                  <th>Memory</th>
                  <th>Test Cases</th>
                  <th>Submitted</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300/50 text-xs">
                {submissions.map((sub, index) => (
                  <tr
                    key={sub._id || index}
                    className="hover:bg-base-200/50 transition-colors"
                  >
                    <td className="text-center font-mono text-[11px] text-base-content/50">
                      {submissions.length - index}
                    </td>
                    <td className="font-mono font-semibold text-xs text-base-content">
                      {sub.language || "N/A"}
                    </td>
                    <td>
                      <span
                        className={`badge badge-xs font-semibold capitalize tracking-tight ${getStatusBadge(
                          sub.status,
                        )}`}
                      >
                        {sub.status || "Unknown"}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-base-content/80">
                      {sub.runtime ?? sub.time ?? "N/A"}s
                    </td>
                    <td className="font-mono text-xs text-base-content/80">
                      {formatMemory(sub.memory)}
                    </td>
                    <td className="font-mono text-xs text-base-content/80">
                      <span className="font-semibold text-base-content">
                        {sub.testCasesPassed ?? 0}
                      </span>
                      /{sub.testCasesTotal ?? 0}
                    </td>
                    <td className="text-[11px] text-base-content/60 whitespace-nowrap">
                      {formatDate(sub.createdAt)}
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedSubmission(sub)}
                        className="btn btn-ghost btn-xs text-primary hover:bg-primary/10 font-semibold gap-1"
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
                        <span>Code</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pr-1">
            <span className="text-[11px] text-base-content/50">
              Showing {submissions.length} total evaluation runs
            </span>
          </div>
        </>
      )}

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <dialog className="modal modal-open" role="dialog" aria-modal="true">
          <div className="modal-box max-w-2xl bg-base-100 border border-base-300 rounded-2xl shadow-xl p-5 sm:p-6 text-base-content">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-base-300/70 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-xs">
                  &lt;/&gt;
                </div>
                <div>
                  <h3 className="text-sm font-bold text-base-content tracking-tight">
                    Submission Details
                  </h3>
                  <p className="text-[11px] font-mono text-base-content/60 uppercase">
                    Language: {selectedSubmission.language || "N/A"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="btn btn-sm btn-circle btn-ghost text-base-content/60 hover:text-base-content"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Performance Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <div className="p-2.5 rounded-xl border border-base-300/80 bg-base-200/40">
                <span className="text-[10px] uppercase font-semibold text-base-content/50 block mb-0.5">
                  Result
                </span>
                <span
                  className={`badge badge-xs font-semibold capitalize ${getStatusBadge(
                    selectedSubmission.status,
                  )}`}
                >
                  {selectedSubmission.status || "Unknown"}
                </span>
              </div>

              <div className="p-2.5 rounded-xl border border-base-300/80 bg-base-200/40">
                <span className="text-[10px] uppercase font-semibold text-base-content/50 block mb-0.5">
                  Runtime
                </span>
                <span className="text-xs font-mono font-bold text-base-content">
                  {selectedSubmission.runtime ??
                    selectedSubmission.time ??
                    "N/A"}
                  s
                </span>
              </div>

              <div className="p-2.5 rounded-xl border border-base-300/80 bg-base-200/40">
                <span className="text-[10px] uppercase font-semibold text-base-content/50 block mb-0.5">
                  Memory
                </span>
                <span className="text-xs font-mono font-bold text-base-content">
                  {formatMemory(selectedSubmission.memory)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl border border-base-300/80 bg-base-200/40">
                <span className="text-[10px] uppercase font-semibold text-base-content/50 block mb-0.5">
                  Test Cases
                </span>
                <span className="text-xs font-mono font-bold text-base-content">
                  {selectedSubmission.testCasesPassed ?? 0}/
                  {selectedSubmission.testCasesTotal ?? 0}
                </span>
              </div>
            </div>

            {/* Error Message Trace */}
            {selectedSubmission.errorMessage && (
              <div className="mb-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-error mb-1.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5 shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Runtime Error</span>
                </div>
                <pre className="p-3 bg-error/10 text-error border border-error/20 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed">
                  {selectedSubmission.errorMessage}
                </pre>
              </div>
            )}

            {/* Submitted Source Code Block */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-base-content">
                  Submitted Code
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(selectedSubmission.code)}
                  className="btn btn-ghost btn-xs text-primary gap-1 text-[11px] font-semibold"
                >
                  {copied ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5 text-success"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-success">Copied!</span>
                    </>
                  ) : (
                    <>
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
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 bg-base-200/70 border border-base-300 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed max-h-80 select-all">
                <code>{selectedSubmission.code || "// No code available"}</code>
              </pre>
            </div>

            {/* Modal Actions Footer */}
            <div className="modal-action mt-5 pt-3 border-t border-base-300/70 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="btn btn-sm btn-ghost font-medium"
              >
                Close
              </button>
            </div>
          </div>

          <form
            method="dialog"
            className="modal-backdrop bg-black/40 backdrop-blur-xs"
          >
            <button type="button" onClick={() => setSelectedSubmission(null)}>
              close
            </button>
          </form>
        </dialog>
      )}
    </div>
  );
};

export default SubmissionHistory;
