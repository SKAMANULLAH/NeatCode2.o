import { useEffect, useState, useMemo } from "react";
import { NavLink } from "react-router";
import axiosClient from "../utils/axiosClient";
import AppNav from "../components/AppNav";

function Topics() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;
    axiosClient
      .get("/topic/fetchTopicAll")
      .then(({ data }) => {
        if (isMounted) {
          setTopics(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          if (err.response?.status === 404) {
            setTopics([]);
          } else {
            setError(err.response?.data?.message || "Failed to fetch topics");
          }
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return topics;
    const q = searchQuery.toLowerCase();
    return topics.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.subtopic?.some((sub) => sub.title?.toLowerCase().includes(q)),
    );
  }, [topics, searchQuery]);

  return (
    <div className="min-h-screen bg-base-100 flex flex-col text-base-content selection:bg-primary selection:text-primary-content">
      <AppNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header Section */}
        <section className="mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>Curriculum & Revision Catalog</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-base-content">
                Computer Science Topics
              </h1>
              <p className="mt-1.5 text-base text-base-content/70 max-w-xl">
                Explore structured conceptual lessons, in-depth walkthroughs, and practice subtopics.
              </p>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-bordered w-full pl-9 text-xs focus:outline-2 focus:outline-primary"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-base-content/50 hover:text-base-content"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="loading loading-spinner loading-lg text-primary mb-3" />
            <p className="text-sm font-medium text-base-content/70">
              Loading topics catalog...
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
        {!loading && !error && filteredTopics.length === 0 && (
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
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-base font-bold text-base-content">
              {searchQuery ? "No matching topics found" : "No topics found"}
            </h3>
            <p className="text-xs text-base-content/60 mt-1">
              {searchQuery
                ? `No topics match "${searchQuery}". Try another search.`
                : "Topics are currently being organized. Check back soon."}
            </p>
          </div>
        )}

        {/* Topics Grid */}
        {!loading && !error && filteredTopics.length > 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTopics.map((topic, index) => {
              const subtopicsCount = topic.subtopic?.length || 0;

              return (
                <NavLink
                  key={topic._id}
                  to={`/topics/${topic._id}`}
                  className="interactive-card group relative flex flex-col justify-between p-6 rounded-2xl border border-base-300 bg-base-100 hover:border-primary/40 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-sm transition-transform group-hover:scale-105 duration-200">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <span className="badge badge-sm badge-ghost border-base-300 text-xs font-semibold text-base-content/70">
                        {subtopicsCount}{" "}
                        {subtopicsCount === 1 ? "Lesson" : "Lessons"}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold tracking-tight text-base-content group-hover:text-primary transition-colors line-clamp-1">
                      {topic.title}
                    </h2>
                    <p className="mt-1.5 text-xs sm:text-sm text-base-content/70 line-clamp-2 leading-relaxed">
                      Structured curriculum and technical notes covering{" "}
                      {topic.title.toLowerCase()}.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-base-200 flex items-center justify-between text-xs font-bold text-primary">
                    <span>View Curriculum</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 transform transition-transform group-hover:translate-x-1 duration-150"
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
          </section>
        )}
      </main>
    </div>
  );
}

export default Topics;
