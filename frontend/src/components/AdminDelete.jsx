import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import axiosClient from "../utils/axiosClient";
import AppNav from "../components/AppNav";

const AdminDelete = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProblems = async () => {
    try {
      setLoading(true);

      const { data } = await axiosClient.get("/problem/fetchProblemAll");

      setProblems(Array.isArray(data) ? data : (data.problems ?? []));
    } catch (err) {
      setError("Failed to fetch problems");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const handleDelete = async (id) => {
    try {
      setDeleting(true);
      await axiosClient.delete(`/problem/deleteProblem/${id}`);

      setProblems((prevProblems) =>
        prevProblems.filter((problem) => problem._id !== id),
      );

      setSelectedProblem(null);
    } catch (err) {
      setError("Failed to delete problem");
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const getDifficultyBadgeClass = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "badge-success text-success-content";
      case "medium":
        return "badge-warning text-warning-content";
      case "hard":
        return "badge-error text-error-content";
      default:
        return "badge-ghost";
    }
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col text-base-content selection:bg-primary selection:text-primary-content">
      <AppNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <nav aria-label="Breadcrumb">
            <ul className="flex items-center gap-2 text-xs font-medium text-base-content/60">
              <li>
                <NavLink
                  to="/admin"
                  className="hover:text-primary transition-colors"
                >
                  Admin Panel
                </NavLink>
              </li>
              <li>/</li>
              <li className="text-base-content font-semibold">
                Delete Problem
              </li>
            </ul>
          </nav>

          <NavLink
            to="/admin"
            className="btn btn-ghost btn-xs sm:btn-sm gap-1.5 text-base-content/70 hover:text-base-content"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back to Admin</span>
          </NavLink>
        </div>

        {/* Page Header */}
        <section className="mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-error/10 text-error text-xs font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-error" />
            Danger Zone
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-base-content">
            Delete Problems
          </h1>
          <p className="mt-2 text-base text-base-content/70 max-w-2xl">
            Manage and permanently purge coding problems and their corresponding
            test suites from the platform.
          </p>
        </section>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="loading loading-spinner loading-lg text-primary mb-3" />
            <p className="text-sm font-medium text-base-content/70">
              Loading platform problems...
            </p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error text-sm rounded-2xl shadow-xs mb-8 flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-5 w-5 mt-0.5"
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
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && problems.length === 0 && (
          <div className="text-center py-16 rounded-2xl border border-dashed border-base-300 bg-base-200/20 px-4">
            <div className="w-12 h-12 rounded-xl bg-base-200 text-base-content/40 flex items-center justify-center mx-auto mb-3">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-base font-bold text-base-content">
              No problems available
            </h3>
            <p className="text-xs text-base-content/60 mt-1">
              There are currently no problems left to delete on this platform.
            </p>
          </div>
        )}

        {/* Problems Table Card */}
        {!loading && !error && problems.length > 0 && (
          <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-base-300/60 bg-base-200/30 flex items-center justify-between">
              <h2 className="text-sm font-bold text-base-content">
                All Problems
              </h2>
              <span className="badge badge-sm badge-ghost border-base-300 font-mono text-xs text-base-content/70">
                {problems.length}{" "}
                {problems.length === 1 ? "Problem" : "Problems"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-sm sm:table-md w-full">
                <thead>
                  <tr className="bg-base-200/50 text-base-content/60 text-xs uppercase tracking-wider">
                    <th className="w-12 text-center">#</th>
                    <th>Title</th>
                    <th className="text-center">Difficulty</th>
                    <th>Tags</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-base-300/50">
                  {problems.map((problem, index) => (
                    <tr
                      key={problem._id}
                      className="hover:bg-base-200/30 transition-colors"
                    >
                      <th className="text-center font-mono text-xs text-base-content/50">
                        {index + 1}
                      </th>

                      <td className="font-semibold text-sm text-base-content">
                        {problem.title}
                      </td>

                      <td className="text-center">
                        <span
                          className={`badge badge-sm font-semibold capitalize text-xs ${getDifficultyBadgeClass(
                            problem.difficulty,
                          )}`}
                        >
                          {problem.difficulty}
                        </span>
                      </td>

                      <td>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {Array.isArray(problem.tags) ? (
                            problem.tags.map((tag) => (
                              <span
                                key={tag}
                                className="badge badge-xs badge-ghost border-base-300 text-base-content/70"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="badge badge-xs badge-ghost border-base-300 text-base-content/70">
                              {problem.tags}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="text-right">
                        <button
                          onClick={() => setSelectedProblem(problem)}
                          className="btn btn-ghost btn-xs text-error hover:bg-error/10 hover:text-error font-semibold gap-1.5 focus-visible:outline-2 focus-visible:outline-error"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DaisyUI Deletion Modal */}
        {selectedProblem && (
          <dialog className="modal modal-open" role="dialog" aria-modal="true">
            <div className="modal-box max-w-md bg-base-100 border border-base-300 rounded-2xl shadow-xl p-6">
              <div className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center mb-4">
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>

              <h3 className="text-lg font-bold text-base-content">
                Delete Problem?
              </h3>
              <p className="mt-2 text-sm text-base-content/70 leading-relaxed">
                Are you sure you want to permanently delete{" "}
                <strong className="text-base-content font-semibold">
                  "{selectedProblem.title}"
                </strong>
                ?
              </p>
              <p className="mt-1 text-xs text-error font-medium">
                This action cannot be undone and will delete all related test
                suites.
              </p>

              <div className="modal-action mt-6 pt-3 border-t border-base-300 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProblem(null)}
                  disabled={deleting}
                  className="btn btn-ghost btn-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(selectedProblem._id)}
                  disabled={deleting}
                  className="btn btn-error btn-sm font-semibold text-white gap-2 shadow-xs"
                >
                  {deleting ? (
                    <>
                      <span className="loading loading-spinner loading-xs" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Yes, Delete</span>
                  )}
                </button>
              </div>
            </div>

            <form
              method="dialog"
              className="modal-backdrop bg-black/40 backdrop-blur-xs"
            >
              <button type="button" onClick={() => setSelectedProblem(null)}>
                close
              </button>
            </form>
          </dialog>
        )}
      </main>
    </div>
  );
};

export default AdminDelete;
