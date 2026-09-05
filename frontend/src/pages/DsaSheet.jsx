import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import axiosClient from "../utils/axiosClient";
import AppNav from "../components/AppNav";
import { PROBLEM_TAG_OPTIONS } from "../utils/problemTags";

function DsaSheet() {
  const [problems, setProblems] = useState([]);
  const [totalProblems, setTotalProblems] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState({
    difficulty: "all",
    tag: "all",
    status: "all",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchProblems = async () => {
      try {
        setLoading(true);
        setError("");

        const params = {};
        if (search) params.search = search;
        if (filters.difficulty !== "all")
          params.difficulty = filters.difficulty;
        if (filters.tag !== "all") params.tag = filters.tag;
        if (filters.status !== "all") params.status = filters.status;

        const { data } = await axiosClient.get("/problem/fetchProblemAll", {
          params,
          signal: controller.signal,
        });

        const list = Array.isArray(data) ? data : (data.problems ?? []);
        setProblems(list);
        setTotalProblems(data.totalProblems ?? list.length);
        setSolvedCount(
          data.solvedCount ?? list.filter((problem) => problem.solved).length,
        );
      } catch (err) {
        if (err.code === "ERR_CANCELED" || err.name === "CanceledError") {
          return;
        }
        setError(err.response?.data?.message || "Failed to fetch problems");
        setProblems([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProblems();

    return () => controller.abort();
  }, [search, filters]);

  const progressPercentage =
    totalProblems > 0 ? Math.round((solvedCount / totalProblems) * 100) : 0;

  return (
    <div className="min-h-screen bg-base-100 flex flex-col text-base-content">
      <AppNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Page Header */}
        <section className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Curated Practice
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-base-content">
            DSA Sheet
          </h1>
          <p className="mt-2 text-base text-base-content/70 max-w-xl">
            Keep practicing and improve your coding skills with structured
            problem solving.
          </p>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-base-100 border border-base-300 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                Total Problems
              </span>
              <div className="w-8 h-8 rounded-lg bg-base-200 flex items-center justify-center text-base-content/70">
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-extrabold text-base-content mt-2">
              {totalProblems}
            </p>
          </div>

          <div className="bg-base-100 border border-base-300 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                Problems Solved
              </span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-extrabold text-primary mt-2">
              {solvedCount}
            </p>
          </div>

          <div className="bg-base-100 border border-base-300 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                Completion Rate
              </span>
              <div className="w-8 h-8 rounded-lg bg-base-200 flex items-center justify-center text-base-content/70">
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
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-extrabold text-base-content mt-2">
              {progressPercentage}%
            </p>
          </div>
        </section>

        {/* Visual Progress Bar Card */}
        <section className="bg-base-100 border border-base-300 rounded-2xl p-6 mb-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-base font-bold text-base-content">
                Your Progress
              </h2>
              <p className="text-xs text-base-content/60 mt-0.5">
                Keep solving problems consistently to reach your goal.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-base-200 text-base-content">
                {solvedCount} / {totalProblems} Solved
              </span>
              <span className="text-xs font-bold text-primary">
                {progressPercentage}%
              </span>
            </div>
          </div>
          <progress
            className="progress progress-primary w-full h-2.5 bg-base-200"
            value={solvedCount}
            max={totalProblems || 1}
          />
        </section>

        {/* Filter Toolbar */}
        <section className="bg-base-100 border border-base-300 rounded-2xl p-4 sm:p-5 mb-8 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-base-300/60">
            <h2 className="text-sm font-bold text-base-content flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filter Problems
            </h2>
            <span className="text-xs text-base-content/60">
              Showing{" "}
              <span className="font-semibold text-base-content">
                {problems.length}
              </span>{" "}
              problems
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <input
                type="search"
                placeholder="Search problems..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Search problems"
                className="input input-bordered input-sm w-full pl-9 text-xs focus:outline-2 focus:outline-primary"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: e.target.value,
                })
              }
              aria-label="Filter by completion status"
              className="select select-bordered select-sm w-full text-xs focus:outline-2 focus:outline-primary"
            >
              <option value="all">All Problems</option>
              <option value="solved">Solved</option>
              <option value="unsolved">Unsolved</option>
            </select>

            <select
              value={filters.difficulty}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  difficulty: e.target.value,
                })
              }
              aria-label="Filter by difficulty"
              className="select select-bordered select-sm w-full text-xs focus:outline-2 focus:outline-primary"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold text-base-content/60 mb-2">
              Tags
            </p>
            <div
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label="Filter by topic tag"
            >
              <button
                type="button"
                onClick={() => setFilters({ ...filters, tag: "all" })}
                className={`btn btn-xs ${
                  filters.tag === "all"
                    ? "btn-primary"
                    : "btn-ghost border border-base-300"
                }`}
              >
                All Tags
              </button>
              {PROBLEM_TAG_OPTIONS.map((tag) => (
                <button
                  type="button"
                  key={tag.value}
                  onClick={() => setFilters({ ...filters, tag: tag.value })}
                  className={`btn btn-xs ${
                    filters.tag === tag.value
                      ? "btn-primary"
                      : "btn-ghost border border-base-300"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Feedback: Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="loading loading-spinner loading-md text-primary mb-3" />
            <p className="text-sm font-medium text-base-content/70">
              Loading problems...
            </p>
          </div>
        )}

        {/* Feedback: Error Alert */}
        {error && (
          <div className="alert alert-error mb-6 text-sm shadow-xs rounded-xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-5 w-5"
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
        )}

        {/* Problems List / Table View */}
        {!loading && !error && (
          <section className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden shadow-xs">
            {/* Table Header row */}
            <div className="hidden sm:grid sm:grid-cols-12 px-6 py-3.5 bg-base-200/50 border-b border-base-300 text-xs font-semibold uppercase tracking-wider text-base-content/60">
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-6">Problem</div>
              <div className="col-span-2 text-center">Difficulty</div>
              <div className="col-span-2 text-center">Tag</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            <div className="divide-y divide-base-300/60">
              {problems.map((problem) => {
                const solved = Boolean(problem.solved);

                return (
                  <NavLink
                    key={problem._id}
                    to={`/problem/${problem._id}`}
                    className="group flex flex-col sm:grid sm:grid-cols-12 px-4 sm:px-6 py-4 items-start sm:items-center gap-2 sm:gap-0 hover:bg-base-200/40 transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    {/* Solved Icon Status */}
                    <div className="sm:col-span-1 flex items-center sm:justify-center">
                      {solved ? (
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-base-300 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-base-300" />
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <div className="sm:col-span-6 pr-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-base-content group-hover:text-primary transition-colors">
                          {problem.title}
                        </h3>
                        {solved && (
                          <span className="badge badge-xs badge-primary font-medium sm:hidden">
                            Solved
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Difficulty Badge */}
                    <div className="sm:col-span-2 flex sm:justify-center mt-1 sm:mt-0">
                      <span
                        title={getDifficultyBadgeColor(problem.difficulty)}
                        className={`badge badge-sm font-semibold capitalize text-xs ${getDifficultyBadgeClass(problem.difficulty)}`}
                      >
                        {problem.difficulty}
                      </span>
                    </div>

                    {/* Tag Badge */}
                    <div className="sm:col-span-2 flex sm:justify-center">
                      <span className="badge badge-sm badge-ghost border-base-300 text-xs text-base-content/70">
                        {PROBLEM_TAG_OPTIONS.find(
                          (tag) => tag.value === problem.tags,
                        )?.label || problem.tags}
                      </span>
                    </div>

                    {/* Chevron Action */}
                    <div className="sm:col-span-1 hidden sm:flex justify-end text-base-content/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all">
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </section>
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
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-base font-bold text-base-content">
              No problems found
            </h3>
            <p className="text-xs text-base-content/60 mt-1">
              Try changing your search term or filter parameters.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

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

export default DsaSheet;
