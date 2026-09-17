import { useEffect, useMemo, useState } from "react";
import { NavLink, useParams, useSearchParams } from "react-router";
import axiosClient from "../utils/axiosClient";
import AppNav from "../components/AppNav";

const OPTION_KEYS = ["a", "b", "c", "d"];

function Quiz() {
  const { title } = useParams();
  const [searchParams] = useSearchParams();
  const countParam = searchParams.get("count");
  const topicIdsKey = searchParams.getAll("topicId").join(",");
  const subtopicIdsKey = searchParams.getAll("subtopicId").join(",");

  const topicIds = useMemo(
    () => (topicIdsKey ? topicIdsKey.split(",") : []),
    [topicIdsKey],
  );

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError("");
        setSubmitted(false);
        setAnswers({});

        const count = parseInt(countParam, 10);
        if (!Number.isInteger(count) || count < 1) {
          setQuiz(null);
          setError("Please enter how many questions you want.");
          return;
        }

        const params = new URLSearchParams();
        params.set("count", String(count));
        if (topicIdsKey) {
          topicIdsKey.split(",").forEach((id) => params.append("topicId", id));
        }
        if (subtopicIdsKey) {
          subtopicIdsKey
            .split(",")
            .forEach((id) => params.append("subtopicId", id));
        }

        const response = title
          ? await axiosClient.get(
              `/quiz/fetchQuiz/${encodeURIComponent(title)}?count=${count}`,
            )
          : await axiosClient.get(`/quiz/fetchRandom?${params.toString()}`);

        setQuiz(response.data);
      } catch (err) {
        setQuiz(null);
        if (err.response?.status === 404) {
          setError(err.response?.data?.message || "Quiz not found");
        } else if (err.response?.status === 401) {
          setError(err.response?.data?.message || "Unauthorized");
        } else {
          setError(err.response?.data?.message || "Failed to fetch quiz");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [title, countParam, topicIdsKey, subtopicIdsKey]);

  const handleSelect = (questionIndex, choiceKey) => {
    if (submitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: choiceKey,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!quiz?.question?.length) return;

    let nextScore = 0;
    quiz.question.forEach((question, index) => {
      if (answers[index] && answers[index] === question.correct) {
        nextScore += 1;
      }
    });

    setScore(nextScore);
    setSubmitted(true);
  };

  const totalQuestions = quiz?.question?.length || 0;
  const answeredCount = Object.keys(answers).length;
  const scorePercentage =
    totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen bg-base-100 flex flex-col text-base-content">
      <AppNav />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Back Navigation */}
        <div className="mb-6">
          <NavLink
            to={topicIds.length === 1 ? `/topics/${topicIds[0]}` : "/quizzes"}
            className="btn btn-ghost btn-xs sm:btn-sm gap-1.5 text-base-content/70 hover:text-base-content focus-visible:outline-2 focus-visible:outline-primary rounded-lg -ml-2"
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
            <span>
              {topicIds.length === 1 ? "Back to Topic" : "Back to Quiz List"}
            </span>
          </NavLink>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="loading loading-spinner loading-lg text-primary mb-3" />
            <p className="text-sm font-medium text-base-content/70">
              Loading quiz assessment...
            </p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error text-sm rounded-2xl shadow-xs mb-8">
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

        {/* Quiz Content */}
        {!loading && !error && quiz && (
          <section className="space-y-8">
            {/* Header / Meta Card */}
            <div className="bg-base-100 border border-base-300 rounded-2xl p-6 sm:p-8 shadow-xs">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Skill Assessment
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-base-content">
                {quiz.title}
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-base-content/70 leading-relaxed">
                Requested {quiz.requestedCount || countParam} questions. Showing{" "}
                <span className="font-semibold text-base-content">
                  {quiz.question?.length || 0}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-base-content">
                  {quiz.totalAvailable || 0}
                </span>{" "}
                available questions.
              </p>

              {/* Progress / Answering Meta */}
              {!submitted && totalQuestions > 0 && (
                <div className="mt-5 pt-4 border-t border-base-300/60">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-base-content/60 font-medium">
                      Answering Progress
                    </span>
                    <span className="font-mono font-semibold text-base-content">
                      {answeredCount} / {totalQuestions} Answered (
                      {Math.round((answeredCount / totalQuestions) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-base-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${Math.round((answeredCount / totalQuestions) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Empty State */}
            {(!quiz.question || quiz.question.length === 0) && (
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
                  No questions found
                </h3>
                <p className="text-xs text-base-content/60 mt-1">
                  This quiz does not have questions yet.
                </p>
              </div>
            )}

            {/* Questions Form */}
            {quiz.question?.length > 0 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {quiz.question.map((question, questionIndex) => {
                  const selectedChoice = answers[questionIndex];
                  const isCorrect = selectedChoice === question.correct;

                  return (
                    <fieldset
                      key={question._id || questionIndex}
                      className={`border rounded-2xl p-5 sm:p-6 transition-all shadow-xs ${
                        submitted
                          ? isCorrect
                            ? "bg-success/5 border-success/30"
                            : "bg-error/5 border-error/30"
                          : "bg-base-100 border-base-300"
                      }`}
                    >
                      <legend className="float-none w-auto px-2 text-xs font-mono font-bold uppercase tracking-wider text-base-content/50">
                        Question {questionIndex + 1}
                      </legend>

                      <p className="text-sm sm:text-base font-bold text-base-content leading-relaxed mb-4">
                        {question.statement}
                      </p>

                      {/* Options Grid */}
                      <div className="space-y-2.5">
                        {question.option?.map((option, optionIndex) => {
                          const choiceKey = OPTION_KEYS[optionIndex];
                          if (!choiceKey) return null;

                          const isSelected = selectedChoice === choiceKey;
                          const isOptionCorrect =
                            choiceKey === question.correct;

                          let optionStyle =
                            "border-base-300 bg-base-100 hover:bg-base-200/50";

                          if (submitted) {
                            if (isOptionCorrect) {
                              optionStyle =
                                "border-success bg-success/15 text-base-content font-medium";
                            } else if (isSelected && !isOptionCorrect) {
                              optionStyle =
                                "border-error bg-error/15 text-base-content font-medium";
                            } else {
                              optionStyle = "border-base-300/60 opacity-60";
                            }
                          } else if (isSelected) {
                            optionStyle =
                              "border-primary bg-primary/10 text-base-content font-medium shadow-xs";
                          }

                          return (
                            <label
                              key={option._id || optionIndex}
                              className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all duration-150 ${optionStyle} ${
                                submitted ? "cursor-default" : ""
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question-${questionIndex}`}
                                value={choiceKey}
                                checked={isSelected}
                                onChange={() =>
                                  handleSelect(questionIndex, choiceKey)
                                }
                                disabled={submitted}
                                className="radio radio-primary radio-xs shrink-0"
                              />
                              <span className="font-mono font-bold uppercase text-xs text-base-content/60 shrink-0">
                                {choiceKey.toUpperCase()}.
                              </span>
                              <span className="flex-1 leading-relaxed">
                                {option.choice}
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      {/* Result Feedback Banner */}
                      {submitted && (
                        <div
                          className={`mt-4 pt-3 border-t text-xs flex items-center gap-2 font-medium ${
                            isCorrect
                              ? "border-success/20 text-success"
                              : "border-error/20 text-error"
                          }`}
                        >
                          {isCorrect ? (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 shrink-0"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>Correct</span>
                            </>
                          ) : (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 shrink-0"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>
                                Incorrect. Correct answer:{" "}
                                <strong className="font-bold underline">
                                  {String(question.correct || "").toUpperCase()}
                                </strong>
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </fieldset>
                  );
                })}

                {/* Submit Sticky Bar */}
                {!submitted && (
                  <div className="sticky bottom-4 z-40 bg-base-100/95 backdrop-blur-md border border-base-300 p-4 sm:p-5 rounded-2xl shadow-lg flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-base-content/70">
                        {answeredCount === totalQuestions ? (
                          <span className="text-success font-medium">
                            All questions answered! Ready to submit.
                          </span>
                        ) : (
                          <span>
                            Answered{" "}
                            <strong className="text-base-content font-bold">
                              {answeredCount}
                            </strong>{" "}
                            of {totalQuestions} questions.
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm px-6 font-semibold shadow-xs"
                    >
                      Submit Quiz
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* Results Card */}
            {submitted && (
              <div className="bg-base-100 border border-base-300 rounded-2xl p-6 sm:p-10 shadow-xs text-center space-y-6">
                <div className="inline-flex flex-col items-center">
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center font-extrabold text-2xl mb-3 shadow-inner ${
                      scorePercentage >= 80
                        ? "bg-success/15 text-success border-2 border-success/30"
                        : scorePercentage >= 50
                          ? "bg-warning/15 text-warning border-2 border-warning/30"
                          : "bg-error/15 text-error border-2 border-error/30"
                    }`}
                  >
                    {scorePercentage}%
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-base-content">
                    {scorePercentage >= 80
                      ? "Outstanding Performance! 🌟"
                      : scorePercentage >= 50
                        ? "Good Job! Keep Practicing 📈"
                        : "Review Recommended 💪"}
                  </h2>
                  <p className="text-xs sm:text-sm text-base-content/65 mt-1 max-w-md mx-auto leading-relaxed">
                    {scorePercentage >= 80
                      ? "You've demonstrated a strong command of this topic material."
                      : scorePercentage >= 50
                        ? "Solid effort! Revisit the questions marked in red below to improve."
                        : "Spend some more time reviewing lesson notes and try another quiz session."}
                  </p>
                </div>

                {/* Score Breakdown Grid */}
                <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                  <div className="p-3 bg-base-200/50 border border-base-300 rounded-xl text-center">
                    <span className="text-[11px] font-semibold text-base-content/55 uppercase tracking-wide block mb-1">
                      Correct
                    </span>
                    <span className="text-lg sm:text-xl font-mono font-extrabold text-success">
                      {score}
                    </span>
                  </div>

                  <div className="p-3 bg-base-200/50 border border-base-300 rounded-xl text-center">
                    <span className="text-[11px] font-semibold text-base-content/55 uppercase tracking-wide block mb-1">
                      Incorrect
                    </span>
                    <span className="text-lg sm:text-xl font-mono font-extrabold text-error">
                      {totalQuestions - score}
                    </span>
                  </div>

                  <div className="p-3 bg-base-200/50 border border-base-300 rounded-xl text-center">
                    <span className="text-[11px] font-semibold text-base-content/55 uppercase tracking-wide block mb-1">
                      Total
                    </span>
                    <span className="text-lg sm:text-xl font-mono font-extrabold text-base-content">
                      {totalQuestions}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      window.scrollTo({ top: 400, behavior: "smooth" });
                    }}
                    className="btn btn-outline btn-sm font-semibold w-full sm:w-auto"
                  >
                    Review Answers Below
                  </button>

                  <NavLink
                    to={
                      topicIds.length === 1
                        ? `/topics/${topicIds[0]}`
                        : "/quizzes"
                    }
                    className="btn btn-primary btn-sm font-semibold w-full sm:w-auto shadow-xs"
                  >
                    {topicIds.length === 1
                      ? "Return to Topic"
                      : "Try Another Quiz"}
                  </NavLink>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default Quiz;
