import { useEffect, useState } from "react";
import { NavLink, useParams } from "react-router";
import axiosClient from "../utils/axiosClient";
import AppNav from "../components/AppNav";
import MarkdownContent from "../components/MarkdownContent";

function Subtopic() {
  const { topicId, subtopicId } = useParams();
  const [topic, setTopic] = useState(null);
  const [subtopic, setSubtopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Track current, previous, and next items
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [prevSubtopic, setPrevSubtopic] = useState(null);
  const [nextSubtopic, setNextSubtopic] = useState(null);

  useEffect(() => {
    const fetchSubtopic = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await axiosClient.get(`/topic/fetchTopic/${topicId}`);
        setTopic(data);

        const subtopicsList = data?.subtopic || [];
        const index = subtopicsList.findIndex(
          (item) => String(item._id) === String(subtopicId),
        );

        if (index === -1) {
          setSubtopic(null);
          setError("Subtopic not found");
          return;
        }

        setCurrentIndex(index);
        setSubtopic(subtopicsList[index]);
        setPrevSubtopic(index > 0 ? subtopicsList[index - 1] : null);
        setNextSubtopic(
          index < subtopicsList.length - 1 ? subtopicsList[index + 1] : null,
        );
      } catch (err) {
        setTopic(null);
        setSubtopic(null);
        if (err.response?.status === 404) {
          setError(err.response?.data?.message || "Topic not found");
        } else if (err.response?.status === 401) {
          setError(err.response?.data?.message || "Unauthorized");
        } else {
          setError(err.response?.data?.message || "Failed to fetch subtopic");
        }
      } finally {
        setLoading(false);
      }
    };

    if (topicId && subtopicId) {
      fetchSubtopic();
    }
  }, [topicId, subtopicId]);

  return (
    <div className="min-h-screen bg-base-100 flex flex-col text-base-content selection:bg-primary selection:text-primary-content">
      <AppNav />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Navigation Breadcrumbs & Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <nav aria-label="Breadcrumb">
            <ul className="flex items-center gap-2 text-xs font-medium text-base-content/60 flex-wrap">
              <li>
                <NavLink
                  to="/topics"
                  className="hover:text-primary transition-colors"
                >
                  Topics
                </NavLink>
              </li>
              <li>/</li>
              <li>
                <NavLink
                  to={`/topics/${topicId}`}
                  className="hover:text-primary transition-colors max-w-[150px] sm:max-w-xs truncate block"
                >
                  {topic?.title || "Topic"}
                </NavLink>
              </li>
              {subtopic && (
                <>
                  <li>/</li>
                  <li className="text-base-content font-semibold max-w-[150px] sm:max-w-xs truncate">
                    {subtopic.title}
                  </li>
                </>
              )}
            </ul>
          </nav>

          <NavLink
            to={`/topics/${topicId}`}
            className="btn btn-ghost btn-xs sm:btn-sm gap-1.5 text-base-content/70 hover:text-base-content self-start sm:self-auto -ml-2 sm:ml-0"
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
            <span>Back to {topic?.title || "Topic"}</span>
          </NavLink>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="loading loading-spinner loading-lg text-primary mb-3" />
            <p className="text-sm font-medium text-base-content/70">
              Loading study material...
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

        {/* Subtopic Main Article */}
        {!loading && !error && subtopic && (
          <article className="space-y-6">
            {/* Header / Title Banner */}
            <div className="border-b border-base-300 pb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Lesson Note
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-base-content">
                {subtopic.title}
              </h1>
              {topic?.title && (
                <p className="mt-2 text-xs sm:text-sm text-base-content/60">
                  Part of the{" "}
                  <span className="font-semibold text-base-content">
                    {topic.title}
                  </span>{" "}
                  curriculum
                </p>
              )}
            </div>

            {/* Markdown Body Card */}
            <div className="bg-base-100 border border-base-300 rounded-2xl p-6 sm:p-10 shadow-xs leading-relaxed">
              <div className="prose prose-sm sm:prose-base max-w-none text-base-content/90 prose-headings:text-base-content prose-headings:font-bold prose-code:text-primary prose-code:font-mono prose-pre:bg-base-200/70 prose-pre:border prose-pre:border-base-300 prose-pre:text-base-content">
                <MarkdownContent content={subtopic.content} />
              </div>
            </div>

            {/* Bottom Navigation & Pagination Controls */}
            <div className="pt-6 border-t border-base-300 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Previous Button */}
              {prevSubtopic ? (
                <NavLink
                  to={`/topics/${topicId}/subtopics/${prevSubtopic._id}`}
                  className="btn btn-outline btn-sm sm:btn-md font-semibold gap-2 w-full sm:w-auto"
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">
                    Prev: {prevSubtopic.title}
                  </span>
                </NavLink>
              ) : (
                <button
                  disabled
                  className="btn btn-outline btn-sm sm:btn-md font-semibold gap-2 btn-disabled w-full sm:w-auto opacity-50"
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  <span>Previous</span>
                </button>
              )}

              {/* Counter Indicator */}
              {topic?.subtopic?.length > 0 && (
                <span className="text-xs font-semibold text-base-content/50 order-first sm:order-none">
                  Lesson {currentIndex + 1} of {topic.subtopic.length}
                </span>
              )}

              {/* Next Button / Complete & Return */}
              {nextSubtopic ? (
                <NavLink
                  to={`/topics/${topicId}/subtopics/${nextSubtopic._id}`}
                  className="btn btn-primary btn-sm sm:btn-md font-semibold gap-2 w-full sm:w-auto shadow-xs"
                >
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">
                    Next: {nextSubtopic.title}
                  </span>
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
                </NavLink>
              ) : (
                <NavLink
                  to={`/topics/${topicId}`}
                  className="btn btn-success btn-sm sm:btn-md text-white font-semibold gap-2 w-full sm:w-auto shadow-xs"
                >
                  <span>Finish Module</span>
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
                </NavLink>
              )}
            </div>
          </article>
        )}
      </main>
    </div>
  );
}

export default Subtopic;
