import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import axiosClient from "../utils/axiosClient";
import AppNav from "../components/AppNav";

function QuizList() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [selectedSubtopics, setSelectedSubtopics] = useState([]);
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await axiosClient.get("/topic/fetchTopicAll");
        setTopics(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.response?.status === 404) {
          setTopics([]);
          setError("");
        } else {
          setError(err.response?.data?.message || "Failed to fetch topics");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  const toggleSubtopic = (subtopicId) => {
    setSelectedSubtopics((current) =>
      current.includes(subtopicId)
        ? current.filter((id) => id !== subtopicId)
        : [...current, subtopicId],
    );
  };

  const selectAllInTopic = (topic) => {
    const topicSubtopicIds = (topic.subtopic || []).map((sub) =>
      String(sub._id),
    );
    const allSelected = topicSubtopicIds.every((id) =>
      selectedSubtopics.includes(id),
    );

    if (allSelected) {
      setSelectedSubtopics((current) =>
        current.filter((id) => !topicSubtopicIds.includes(id)),
      );
    } else {
      setSelectedSubtopics((current) => [
        ...current,
        ...topicSubtopicIds.filter((id) => !current.includes(id)),
      ]);
    }
  };

  const startQuiz = (event) => {
    event.preventDefault();
    const questionCount = Math.max(1, parseInt(count, 10) || 1);

    if (selectedSubtopics.length === 0) {
      setError("Select at least one subtopic.");
      return;
    }

    const params = new URLSearchParams();
    params.set("count", String(questionCount));
    selectedSubtopics.forEach((id) => params.append("subtopicId", id));
    navigate(`/quizzes/start?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col text-base-content">
      <AppNav />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header Section */}
        <section className="mb-8 md:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Custom Assessment
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-base-content">
            Practice Quiz
          </h1>
          <p className="mt-2 text-base text-base-content/70 max-w-2xl">
            Select subtopics from each topic, then choose how many questions you
            want. A random quiz will be generated from those subtopics.
          </p>
        </section>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="loading loading-spinner loading-lg text-primary mb-3" />
            <p className="text-sm font-medium text-base-content/70">
              Loading available topics and subtopics...
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
            <div className="flex-1">
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && topics.length === 0 && (
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-base font-bold text-base-content">
              No topics found
            </h3>
            <p className="text-xs text-base-content/60 mt-1">
              Topics are currently unavailable. Check back soon.
            </p>
          </div>
        )}

        {/* Configuration & Selection Form */}
        {!loading && topics.length > 0 && (
          <form onSubmit={startQuiz} className="space-y-6">
            {/* Control Strip */}
            <div className="bg-base-100 border border-base-300 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label
                  htmlFor="question-count"
                  className="text-xs font-bold uppercase tracking-wider text-base-content/60 block mb-1"
                >
                  Number of Questions
                </label>
                <p className="text-xs text-base-content/60">
                  Select between 1 and 50 questions for this session.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="question-count"
                  type="number"
                  min="1"
                  max="150"
                  value={count}
                  onChange={(event) => setCount(event.target.value)}
                  required
                  className="input input-bordered input-sm sm:input-md w-28 text-center font-mono font-bold focus:outline-2 focus:outline-primary"
                />
                <span className="text-xs font-semibold text-base-content/70">
                  Questions
                </span>
              </div>
            </div>

            {/* Topics & Subtopics Grid */}
            <div className="space-y-5">
              {topics.map((topic) => {
                const subtopics = topic.subtopic || [];
                const topicSubtopicIds = subtopics.map((sub) =>
                  String(sub._id),
                );
                const selectedInTopic = topicSubtopicIds.filter((id) =>
                  selectedSubtopics.includes(id),
                );
                const allSelected =
                  subtopics.length > 0 &&
                  selectedInTopic.length === subtopics.length;

                return (
                  <fieldset
                    key={topic._id}
                    className="border border-base-300 bg-base-100 rounded-2xl p-5 sm:p-6 shadow-xs transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-base-300/60 pb-3 mb-4">
                      <legend className="float-none w-auto px-0 text-base sm:text-lg font-bold text-base-content flex items-center gap-2">
                        <span>{topic.title}</span>
                        {subtopics.length > 0 && (
                          <span className="badge badge-sm badge-ghost text-xs font-normal">
                            {selectedInTopic.length}/{subtopics.length} Selected
                          </span>
                        )}
                      </legend>

                      {subtopics.length > 0 && (
                        <button
                          type="button"
                          onClick={() => selectAllInTopic(topic)}
                          className="btn btn-ghost btn-xs text-primary self-start sm:self-auto font-medium"
                        >
                          {allSelected ? "Deselect all" : "Select all"}
                        </button>
                      )}
                    </div>

                    {subtopics.length === 0 ? (
                      <p className="text-xs text-base-content/50 italic py-2">
                        No subtopics available in this category.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {subtopics.map((subtopic) => {
                          const subtopicId = String(subtopic._id);
                          const isChecked =
                            selectedSubtopics.includes(subtopicId);

                          return (
                            <label
                              key={`${topic._id}-${subtopicId}`}
                              className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all duration-150 ${
                                isChecked
                                  ? "border-primary bg-primary/10 text-base-content font-medium shadow-xs"
                                  : "border-base-300 bg-base-100 hover:bg-base-200/50 text-base-content/80"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSubtopic(subtopicId)}
                                className="checkbox checkbox-primary checkbox-xs rounded-sm mt-0.5 shrink-0"
                              />
                              <span className="leading-snug break-words">
                                {subtopic.title}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </fieldset>
                );
              })}
            </div>

            {/* Sticky Action Footer */}
            <div className="sticky bottom-4 z-40 bg-base-100/95 backdrop-blur-md border border-base-300 p-4 sm:p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-base-content/70">
                {selectedSubtopics.length === 0 ? (
                  <span>Select at least one subtopic to generate a quiz.</span>
                ) : (
                  <span>
                    Ready to generate{" "}
                    <strong className="text-base-content font-bold">
                      {count}
                    </strong>{" "}
                    questions across{" "}
                    <strong className="text-primary font-bold">
                      {selectedSubtopics.length}
                    </strong>{" "}
                    subtopic{selectedSubtopics.length === 1 ? "" : "s"}.
                  </span>
                )}
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-sm px-6 font-semibold w-full sm:w-auto shadow-xs gap-2"
                disabled={selectedSubtopics.length === 0}
              >
                <span>Start Random Quiz</span>
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
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

export default QuizList;
