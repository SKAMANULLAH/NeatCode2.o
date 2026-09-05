import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import axiosClient from "../utils/axiosClient";
import AppNav from "../components/AppNav";

const AdminUpdate = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await axiosClient.get("/problem/fetchProblemAll");
        setProblems(Array.isArray(data) ? data : (data.problems ?? []));
      } catch (err) {
        console.error(err);
        setError("Failed to fetch problems.");
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

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
                Update Problems
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Content Management
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-base-content">
            Update Problems
          </h1>
          <p className="mt-2 text-base text-base-content/70 max-w-2xl">
            Select a coding challenge to edit its test cases, statement,
            reference solutions, or starter code.
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
              No problems found
            </h3>
            <p className="text-xs text-base-content/60 mt-1">
              There are no problems registered in the database to modify.
            </p>
          </div>
        )}

        {/* Problems Table Card */}
        {!loading && !error && problems.length > 0 && (
          <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-base-300/60 bg-base-200/30 flex items-center justify-between">
              <h2 className="text-sm font-bold text-base-content">
                Problem List
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
                    <th className="text-right">Action</th>
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
                        <NavLink
                          to={`/admin/update/${problem._id}`}
                          className="btn btn-ghost btn-xs text-primary hover:bg-primary/10 font-semibold gap-1.5"
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          <span>Update</span>
                        </NavLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminUpdate;
