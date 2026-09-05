import { useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router";
import axiosClient from "../utils/axiosClient";
import AppNav from "../components/AppNav";

function TopicDetail() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await axiosClient.get(`/topic/fetchTopic/${topicId}`);
        setTopic(data);
      } catch (err) {
        setTopic(null);
        if (err.response?.status === 404) {
          setError(err.response?.data?.message || "Topic not found");
        } else if (err.response?.status === 401) {
          setError(err.response?.data?.message || "Unauthorized");
        } else {
          setError(err.response?.data?.message || "Failed to fetch topic");
        }
      } finally {
        setLoading(false);
      }
    };

    if (topicId) {
      fetchTopic();
    }
  }, [topicId]);

  const startTopicQuiz = (event) => {
    event.preventDefault();
    const questionCount = Math.max(1, parseInt(count, 10) || 1);
    const params = new URLSearchParams();
    params.set("count", String(questionCount));
    params.set("topicId", topicId);
    navigate(`/quizzes/start?${params.toString()}`);
  };

  const subtopicsCount = topic?.subtopic?.length || 0;

  return (
    <div className="min-h-screen bg-base-100 flex flex-col text-base-content selection:bg-primary selection:text-primary-content">
      <AppNav />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Navigation Breadcrumbs & Back Link */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <nav aria-label="Breadcrumb">
            <ul className="flex items-center gap-2 text-xs font-medium text-base-content/60">
              <li>
                <NavLink
                  to="/topics"
                  className="hover:text-primary transition-colors"
                >
                  Topics
                </NavLink>
              </li>
              <li>/</li>
              <li className="text-base-content font-semibold max-w-[200px] sm:max-w-md truncate">
                {topic?.title || "Topic Detail"}
              </li>
            </ul>
          </nav>

          <NavLink
            to="/topics"
            className="btn btn-ghost btn-xs sm:btn-sm gap-1.5 text-base-content/70 hover:text-base-content -mr-2 sm:mr-0"
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
            <span>Back to Topics</span>
          </NavLink>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="loading loading-spinner loading-lg text-primary mb-3" />
            <p className="text-sm font-medium text-base-content/70">
              Loading topic modules...
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

        {/* Topic View */}
        {!loading && !error && topic && (
          <section className="space-y-8">
            {/* Header Card & Quick Quiz Form */}
            <div className="bg-base-100 border border-base-300 rounded-2xl p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Curriculum Module
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-base-content">
                    {topic.title}
                  </h1>
                  <p className="mt-2 text-xs sm:text-sm text-base-content/70 max-w-xl leading-relaxed">
                    Select a subtopic to read its structured markdown notes, or
                    launch an instant timed quiz to test your comprehension.
                  </p>
                </div>

                {/* Inline Quiz Generator Card */}
                <form
                  onSubmit={startTopicQuiz}
                  className="p-4 sm:p-5 rounded-xl border border-base-300 bg-base-200/30 flex flex-col sm:flex-row sm:items-center gap-3 shrink-0"
                >
                  <div className="form-control">
                    <label
                      className="label py-0 pb-1"
                      htmlFor="topic-quiz-count"
                    >
                      <span className="label-text text-xs font-semibold text-base-content/70">
                        Quiz Length
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="topic-quiz-count"
                        type="number"
                        min="1"
                        max="50"
                        value={count}
                        onChange={(event) => setCount(event.target.value)}
                        required
                        className="input input-bordered input-sm w-20 text-center font-mono font-bold focus:outline-2 focus:outline-primary"
                      />
                      <span className="text-xs text-base-content/60 font-medium">
                        Q's
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-sm font-semibold gap-1.5 self-end sm:self-end mt-1 sm:mt-0 shadow-xs"
                  >
                    <span>Start Topic Quiz</span>
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
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </button>
                </form>
              </div>
            </div>

            {/* Subtopics Listing Section */}
            <div>
              <div className="flex items-center justify-between border-b border-base-300/60 pb-3 mb-5">
                <h2 className="text-lg font-bold text-base-content flex items-center gap-2">
                  <span>Subtopic Lessons</span>
                  <span className="badge badge-sm badge-ghost border-base-300 font-semibold">
                    {subtopicsCount}{" "}
                    {subtopicsCount === 1 ? "Lesson" : "Lessons"}
                  </span>
                </h2>
                <span className="text-xs text-base-content/60">
                  Select a section to begin reading
                </span>
              </div>

              {subtopicsCount === 0 && (
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
                    No subtopics found
                  </h3>
                  <p className="text-xs text-base-content/60 mt-1">
                    This topic does not have subtopic lessons added yet.
                  </p>
                </div>
              )}

              {subtopicsCount > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {topic.subtopic.map((subtopic, index) => (
                    <NavLink
                      key={subtopic._id}
                      to={`/topics/${topicId}/subtopics/${subtopic._id}`}
                      className="group p-5 rounded-2xl border border-base-300 bg-base-100 hover:bg-base-200/40 transition-all duration-200 hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-sm flex items-center justify-between gap-4 focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-base-content group-hover:text-primary transition-colors truncate">
                            {subtopic.title}
                          </h3>
                          <span className="text-[11px] text-base-content/50 block mt-0.5">
                            Lesson Notes & Walkthrough
                          </span>
                        </div>
                      </div>

                      <div className="text-base-content/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0">
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
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default TopicDetail;
