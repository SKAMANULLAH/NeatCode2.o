import { useEffect, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { NavLink } from "react-router";
import axiosClient from "../utils/axiosClient";
import AppNav from "../components/AppNav";
import toast from "react-hot-toast";

const emptyQuestion = (topicId = "", subtopicId = "") => ({
  statement: "",
  option: [{ choice: "" }, { choice: "" }, { choice: "" }, { choice: "" }],
  correct: "a",
  topicId,
  subtopicId,
});

function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { register, control, handleSubmit, reset, setValue, getValues } =
    useForm({
      defaultValues: {
        topicId: "",
        subtopicId: "",
        question: [emptyQuestion()],
      },
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "question",
  });

  const selectedTopicId = useWatch({ control, name: "topicId" });
  const selectedSubtopicId = useWatch({ control, name: "subtopicId" });

  const selectedTopic = topics.find(
    (topic) => String(topic._id) === String(selectedTopicId),
  );
  const availableSubtopics = selectedTopic?.subtopic || [];

  const fetchPageData = async () => {
    try {
      setLoading(true);
      setError("");

      const [quizResult, topicResult] = await Promise.allSettled([
        axiosClient.get("/quiz/fetchQuizAll"),
        axiosClient.get("/topic/fetchTopicAll"),
      ]);

      if (quizResult.status === "fulfilled") {
        setQuizzes(
          Array.isArray(quizResult.value.data) ? quizResult.value.data : [],
        );
      } else if (quizResult.reason?.response?.status === 404) {
        setQuizzes([]);
      } else {
        setError(
          quizResult.reason?.response?.data?.message ||
            "Failed to fetch quizzes",
        );
      }

      if (topicResult.status === "fulfilled") {
        setTopics(
          Array.isArray(topicResult.value.data) ? topicResult.value.data : [],
        );
      } else if (topicResult.reason?.response?.status === 404) {
        setTopics([]);
      } else {
        setError(
          (current) =>
            current ||
            topicResult.reason?.response?.data?.message ||
            "Failed to fetch topics",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, []);

  const mapQuestions = (questions, topicId = "", subtopicId = "") => {
    if (!questions?.length) {
      return [emptyQuestion(topicId, subtopicId)];
    }

    return questions.map((item) => ({
      statement: item.statement || "",
      option: [0, 1, 2, 3].map((index) => ({
        choice: item.option?.[index]?.choice || "",
      })),
      correct: item.correct || "a",
      topicId: item.topicId ? String(item.topicId) : topicId,
      subtopicId: item.subtopicId ? String(item.subtopicId) : subtopicId,
    }));
  };

  const loadQuiz = async (title, topicOverride = "") => {
    setSelectedTitle(title);
    if (!title) {
      reset({
        topicId: topicOverride,
        subtopicId: "",
        question: [emptyQuestion(topicOverride, "")],
      });
      return;
    }

    try {
      const { data } = await axiosClient.get(
        `/quiz/fetchQuiz/${encodeURIComponent(title)}`,
      );
      const firstQuestion = data.question?.[0];
      const topicId =
        topicOverride ||
        (firstQuestion?.topicId ? String(firstQuestion.topicId) : "") ||
        String(
          topics.find((topic) => topic.title === data.title)?._id || "",
        );
      const subtopicId = firstQuestion?.subtopicId
        ? String(firstQuestion.subtopicId)
        : "";

      reset({
        topicId,
        subtopicId,
        question: mapQuestions(data.question, topicId, subtopicId),
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load quiz");
    }
  };

  const handleTopicChange = async (topicId) => {
    const topic = topics.find((item) => String(item._id) === String(topicId));
    const existingQuiz = quizzes.find((quiz) => quiz.title === topic?.title);

    if (existingQuiz) {
      await loadQuiz(existingQuiz.title, topicId);
      setValue("subtopicId", "");
      return;
    }

    setSelectedTitle("");
    reset({
      topicId,
      subtopicId: "",
      question: [emptyQuestion(topicId, "")],
    });
  };

  const handleSubtopicChange = (subtopicId) => {
    setValue("subtopicId", subtopicId);
    const questions = getValues("question") || [];
    questions.forEach((question, index) => {
      if (!question.subtopicId) {
        setValue(`question.${index}.subtopicId`, subtopicId);
        setValue(`question.${index}.topicId`, selectedTopicId);
      }
    });
  };

  const onSubmit = async (formData) => {
    if (!formData.topicId) {
      toast.error("Select an existing topic first");
      return;
    }

    const question = formData.question.map((item) => ({
      ...item,
      topicId: item.topicId || formData.topicId,
      subtopicId: item.subtopicId || formData.subtopicId,
    }));

    if (question.some((item) => !item.topicId || !item.subtopicId)) {
      toast.error("Select an existing subtopic, then add questions");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        topicId: formData.topicId,
        subtopicId: formData.subtopicId,
        question,
      };

      if (selectedTitle) {
        await axiosClient.patch(
          `/quiz/updateQuiz/${encodeURIComponent(selectedTitle)}`,
          payload,
        );
        toast.success("Quiz updated successfully");
        setSelectedTitle(selectedTopic?.title || selectedTitle);
      } else {
        await axiosClient.post("/quiz/createQuiz", payload);
        toast.success("Quiz created successfully");
        reset({
          topicId: "",
          subtopicId: "",
          question: [emptyQuestion()],
        });
        setSelectedTitle("");
      }

      await fetchPageData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const optionLabels = [
    { key: "a", label: "A" },
    { key: "b", label: "B" },
    { key: "c", label: "C" },
    { key: "d", label: "D" },
  ];

  return (
    <div className="min-h-screen bg-base-100 flex flex-col text-base-content">
      <AppNav />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumbs" className="mb-6">
          <ul className="flex items-center gap-2 text-xs font-medium text-base-content/60">
            <li>
              <NavLink
                to="/admin"
                className="hover:text-primary transition-colors flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-primary rounded-xs"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Admin Panel
              </NavLink>
            </li>
            <li>/</li>
            <li className="text-base-content font-semibold">Manage Quizzes</li>
          </ul>
        </nav>

        {/* Header Section */}
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Curriculum & Assessments
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Quiz Management
          </h1>
          <p className="mt-1 text-sm text-base-content/70">
            Create quizzes only for topics and subtopics that already exist.
            Pick a topic, pick one of its subtopics, then add questions.
          </p>
        </header>

        {/* Feedback Messages */}
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

        {/* Mode Selector & Quick Switcher Card */}
        <div className="bg-base-100 border border-base-300 rounded-2xl p-5 sm:p-6 mb-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-base-content/50 uppercase tracking-wider block mb-1">
                Workspace Target
              </span>
              <p className="text-sm text-base-content/80 font-medium">
                {selectedTitle ? (
                  <>
                    Editing:{" "}
                    <span className="text-primary font-bold">
                      {selectedTitle}
                    </span>
                  </>
                ) : (
                  "Authoring a brand-new quiz"
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label htmlFor="quizSelector" className="sr-only">
                Edit existing quiz
              </label>
              <select
                id="quizSelector"
                className="select select-bordered select-sm w-full sm:w-64 text-xs font-medium focus:outline-2 focus:outline-primary"
                value={selectedTitle}
                onChange={(e) => loadQuiz(e.target.value)}
                disabled={loading}
              >
                <option value="">＋ Create new quiz</option>
                {quizzes.map((quiz) => (
                  <option key={quiz._id || quiz.title} value={quiz.title}>
                    {quiz.title}
                  </option>
                ))}
              </select>
              {loading && (
                <span className="loading loading-spinner loading-xs text-primary shrink-0" />
              )}
            </div>
          </div>
        </div>

        {/* Editor Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-8"
          noValidate
        >
          {/* Section: Basic Settings */}
          <section className="bg-base-100 border border-base-300 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="border-b border-base-300/60 pb-4 mb-6">
              <h2 className="text-lg font-bold text-base-content">
                Topic & Subtopic
              </h2>
              <p className="text-xs text-base-content/60 mt-0.5">
                Choose an existing topic, then one of its existing subtopics.
                New questions are saved under that pair.
              </p>
            </div>

            {topics.length === 0 && !loading && (
              <div className="alert alert-warning text-sm mb-4 rounded-xl">
                <span>
                  No topics found. Create a topic with subtopics first, then
                  come back to add quizzes.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label pb-1.5" htmlFor="quizTopicSelect">
                  <span className="label-text font-semibold text-xs text-base-content">
                    Topic <span className="text-error">*</span>
                  </span>
                </label>
                <select
                  id="quizTopicSelect"
                  className="select select-bordered w-full text-sm focus:outline-2 focus:outline-primary"
                  value={selectedTopicId || ""}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  disabled={loading || topics.length === 0}
                  required
                >
                  <option value="">Select a topic</option>
                  {topics.map((topic) => (
                    <option key={topic._id} value={topic._id}>
                      {topic.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control w-full">
                <label className="label pb-1.5" htmlFor="quizSubtopicSelect">
                  <span className="label-text font-semibold text-xs text-base-content">
                    Subtopic <span className="text-error">*</span>
                  </span>
                </label>
                <select
                  id="quizSubtopicSelect"
                  className="select select-bordered w-full text-sm focus:outline-2 focus:outline-primary"
                  value={selectedSubtopicId || ""}
                  onChange={(e) => handleSubtopicChange(e.target.value)}
                  disabled={!selectedTopicId || availableSubtopics.length === 0}
                  required
                >
                  <option value="">
                    {selectedTopicId
                      ? "Select a subtopic"
                      : "Select a topic first"}
                  </option>
                  {availableSubtopics.map((subtopic) => (
                    <option key={subtopic._id} value={subtopic._id}>
                      {subtopic.title}
                    </option>
                  ))}
                </select>
                {selectedTopicId && availableSubtopics.length === 0 && (
                  <span className="label-text-alt text-error mt-1">
                    This topic has no subtopics yet.
                  </span>
                )}
              </div>
            </div>

            {selectedTopic && (
              <p className="text-xs text-base-content/60 mt-4">
                Quiz will be saved as{" "}
                <span className="font-semibold text-base-content">
                  {selectedTopic.title}
                </span>
                {selectedSubtopicId
                  ? ` / ${
                      availableSubtopics.find(
                        (item) =>
                          String(item._id) === String(selectedSubtopicId),
                      )?.title || "selected subtopic"
                    }`
                  : ""}
                .
              </p>
            )}
          </section>

          {/* Section: Question Builder */}
          <section className="bg-base-100 border border-base-300 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-base-300/60 pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-base-content">
                    Questions Suite
                  </h2>
                  <span className="badge badge-sm badge-primary font-semibold">
                    {fields.length}{" "}
                    {fields.length === 1 ? "Question" : "Questions"}
                  </span>
                </div>
                <p className="text-xs text-base-content/60 mt-0.5">
                  Questions are attached to the topic and subtopic selected
                  above. Add a statement, 4 choices, and the correct option.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  append(emptyQuestion(selectedTopicId, selectedSubtopicId))
                }
                disabled={!selectedTopicId || !selectedSubtopicId}
                className="btn btn-outline btn-primary btn-xs sm:btn-sm gap-1.5 self-start sm:self-auto font-medium"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Question
              </button>
            </div>

            {fields.length === 0 && (
              <div className="text-center py-10 rounded-xl border border-dashed border-base-300 bg-base-200/40">
                <p className="text-sm font-medium text-base-content/70">
                  No questions in this quiz.
                </p>
                <p className="text-xs text-base-content/50 mt-1">
                  Click "Add Question" above to start populating questions.
                </p>
              </div>
            )}

            <div className="space-y-6">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="border border-base-300 rounded-xl bg-base-200/25 p-5 sm:p-6 transition-all"
                >
                  {/* Question Header & Controls */}
                  <div className="flex items-center justify-between pb-3 border-b border-base-300/60 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-bold font-mono">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-base-content uppercase tracking-wider">
                        Question #{index + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <label
                          htmlFor={`correct-select-${index}`}
                          className="text-xs font-medium text-base-content/70"
                        >
                          Answer:
                        </label>
                        <select
                          id={`correct-select-${index}`}
                          {...register(`question.${index}.correct`)}
                          className="select select-bordered select-xs font-bold uppercase focus:outline-2 focus:outline-primary"
                        >
                          <option value="a">A</option>
                          <option value="b">B</option>
                          <option value="c">C</option>
                          <option value="d">D</option>
                        </select>
                      </div>

                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                          aria-label={`Remove question ${index + 1}`}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    type="hidden"
                    {...register(`question.${index}.topicId`)}
                  />
                  <input
                    type="hidden"
                    {...register(`question.${index}.subtopicId`)}
                  />

                  {/* Statement Area */}
                  <div className="form-control mb-4">
                    <label className="label py-1">
                      <span className="label-text text-xs font-semibold text-base-content">
                        Question Statement <span className="text-error">*</span>
                      </span>
                    </label>
                    <textarea
                      {...register(`question.${index}.statement`)}
                      rows={2}
                      placeholder="e.g. What is the worst-case time complexity of QuickSort?"
                      className="textarea textarea-bordered text-xs font-sans w-full leading-relaxed focus:outline-2 focus:outline-primary"
                    />
                  </div>

                  {/* 4 Choices Grid */}
                  <div>
                    <label className="label py-1">
                      <span className="label-text text-xs font-semibold text-base-content">
                        Answer Choices
                      </span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {optionLabels.map((opt, optIndex) => (
                        <div key={opt.key} className="form-control">
                          <div className="relative flex items-center">
                            <span className="absolute left-3 font-mono font-bold text-xs text-base-content/50 pointer-events-none">
                              {opt.label}.
                            </span>
                            <input
                              {...register(
                                `question.${index}.option.${optIndex}.choice`,
                              )}
                              placeholder={`Option ${opt.label}`}
                              className="input input-bordered input-sm pl-8 w-full text-xs transition-all focus:outline-2 focus:outline-primary"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Sticky Submission Bar */}
          <div className="sticky bottom-4 z-40 bg-base-100/95 backdrop-blur-md border border-base-300 p-4 sm:p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-base-content">
                Ready to publish?
              </h3>
              <p className="text-xs text-base-content/60">
                {selectedTitle
                  ? "Updates will apply immediately to this active quiz."
                  : "New quiz will be saved and added to the student catalog."}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <NavLink
                to="/admin"
                className="btn btn-ghost btn-sm font-medium flex-1 sm:flex-initial"
              >
                Cancel
              </NavLink>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-sm px-6 font-semibold flex-1 sm:flex-initial shadow-xs"
              >
                {submitting ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{selectedTitle ? "Update Quiz" : "Create Quiz"}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default AdminQuizzes;
