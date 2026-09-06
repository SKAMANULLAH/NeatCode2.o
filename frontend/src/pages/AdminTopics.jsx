import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { NavLink } from "react-router";
import axiosClient from "../utils/axiosClient";
import AppNav from "../components/AppNav";
import toast from "react-hot-toast";

function AdminTopics() {
  const [topics, setTopics] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: {
      title: "",
      subtopic: [{ title: "", content: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "subtopic",
  });

  const fetchTopics = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await axiosClient.get("/topic/fetchTopicAll");
      setTopics(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.response?.status === 404) {
        setTopics([]);
      } else {
        setError(err.response?.data?.message || "Failed to fetch topics");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const loadTopic = async (id) => {
    setSelectedId(id);
    if (!id) {
      reset({
        title: "",
        subtopic: [{ title: "", content: "" }],
      });
      return;
    }

    try {
      const { data } = await axiosClient.get(`/topic/fetchTopic/${id}`);
      reset({
        title: data.title || "",
        subtopic:
          data.subtopic?.length > 0
            ? data.subtopic.map((item) => ({
                _id: item._id, // ADD THIS
                title: item.title || "",
                content: item.content || "",
              }))
            : [{ title: "", content: "" }],
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load topic");
    }
  };

  const onSubmit = async (formData) => {
    try {
      setSubmitting(true);
      const payload = {
        title: formData.title,
        subtopic: formData.subtopic.filter(
          (item) => item.title || item.content,
        ),
      };

      if (selectedId) {
        await axiosClient.patch(`/topic/updateTopic/${selectedId}`, payload);
        toast.success("Topic updated successfully");
      } else {
        await axiosClient.post("/topic/createTopic", payload);
        toast.success("Topic created successfully");
        reset({
          title: "",
          subtopic: [{ title: "", content: "" }],
        });
        setSelectedId("");
      }

      await fetchTopics();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save topic");
    } finally {
      setSubmitting(false);
    }
  };

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
            <li className="text-base-content font-semibold">Manage Topics</li>
          </ul>
        </nav>

        {/* Header Section */}
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Curriculum Structure
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Topic Management
          </h1>
          <p className="mt-1 text-sm text-base-content/70">
            Create or edit high-level learning topics and their structured
            markdown subtopics.
          </p>
        </header>

        {/* Error Notification */}
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

        {/* Switcher & Target Card */}
        <div className="bg-base-100 border border-base-300 rounded-2xl p-5 sm:p-6 mb-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-base-content/50 uppercase tracking-wider block mb-1">
                Workspace Target
              </span>
              <p className="text-sm text-base-content/80 font-medium">
                {selectedId ? (
                  <>
                    Editing topic:{" "}
                    <span className="text-primary font-bold">
                      {topics.find((t) => t._id === selectedId)?.title ||
                        selectedId}
                    </span>
                  </>
                ) : (
                  "Authoring a brand-new topic"
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label htmlFor="topicSelector" className="sr-only">
                Edit existing topic
              </label>
              <select
                id="topicSelector"
                className="select select-bordered select-sm w-full sm:w-64 text-xs font-medium focus:outline-2 focus:outline-primary"
                value={selectedId}
                onChange={(e) => loadTopic(e.target.value)}
                disabled={loading}
              >
                <option value="">＋ Create new topic</option>
                {topics.map((topic) => (
                  <option key={topic._id} value={topic._id}>
                    {topic.title}
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
          {/* Main Topic Section */}
          <section className="bg-base-100 border border-base-300 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="border-b border-base-300/60 pb-4 mb-6">
              <h2 className="text-lg font-bold text-base-content">
                Topic Information
              </h2>
              <p className="text-xs text-base-content/60 mt-0.5">
                Primary name and taxonomy label for this subject category.
              </p>
            </div>

            <div className="form-control w-full">
              <label className="label pb-1.5" htmlFor="topicTitleInput">
                <span className="label-text font-semibold text-xs text-base-content">
                  Topic Title <span className="text-error">*</span>
                </span>
              </label>
              <input
                id="topicTitleInput"
                {...register("title")}
                required
                placeholder="e.g. Dynamic Programming or Binary Trees"
                className="input input-bordered w-full text-sm transition-all focus:outline-2 focus:outline-primary"
              />
            </div>
          </section>
          {/* Subtopics Section */}
          <section className="bg-base-100 border border-base-300 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-base-300/60 pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-base-content">
                    Subtopics
                  </h2>
                  <span className="badge badge-sm badge-primary font-semibold">
                    {fields.length}{" "}
                    {fields.length === 1 ? "Section" : "Sections"}
                  </span>
                </div>
                <p className="text-xs text-base-content/60 mt-0.5">
                  Structured lessons, conceptual explanations, and markdown
                  study material.
                </p>
              </div>
            </div>

            {fields.length === 0 && (
              <div className="text-center py-10 rounded-xl border border-dashed border-base-300 bg-base-200/40">
                <p className="text-sm font-medium text-base-content/70">
                  No subtopics defined.
                </p>
                <p className="text-xs text-base-content/50 mt-1">
                  Click "Add Subtopic" below to add lesson sections.
                </p>
              </div>
            )}

            <div className="space-y-6">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="border border-base-300 rounded-xl bg-base-200/25 p-5 sm:p-6 transition-all"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-base-300/60 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-bold font-mono">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-base-content uppercase tracking-wider">
                        Subtopic #{index + 1}
                      </span>
                    </div>

                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                        aria-label={`Remove subtopic ${index + 1}`}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="label-text text-xs font-semibold text-base-content">
                          Subtopic Title
                        </span>
                      </label>
                      <input
                        {...register(`subtopic.${index}.title`)}
                        placeholder="e.g. 0/1 Knapsack Problem Formulation"
                        className="input input-bordered input-sm sm:input-md text-xs sm:text-sm w-full transition-all focus:outline-2 focus:outline-primary"
                      />
                    </div>

                    <div className="form-control">
                      <label className="label py-1">
                        <span className="label-text text-xs font-semibold text-base-content">
                          Markdown Content
                        </span>
                      </label>
                      <textarea
                        {...register(`subtopic.${index}.content`)}
                        rows={6}
                        placeholder="Write detailed explanations, asymptotic complexity, code walk-throughs, or notes in Markdown..."
                        className="textarea textarea-bordered text-xs font-mono w-full leading-relaxed focus:outline-2 focus:outline-primary"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Added button at the end of the list */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => append({ title: "", content: "" })}
                className="btn btn-outline btn-primary w-full gap-1.5 font-medium"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Subtopic
              </button>
            </div>
          </section>

          {/* Sticky Submission Bar */}
          <div className="sticky bottom-4 z-40 bg-base-100/95 backdrop-blur-md border border-base-300 p-4 sm:p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-base-content">
                Ready to publish?
              </h3>
              <p className="text-xs text-base-content/60">
                {selectedId
                  ? "Updates will apply immediately to this active curriculum topic."
                  : "New topic will be saved and added to the topics list."}
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
                  <span>{selectedId ? "Update Topic" : "Create Topic"}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default AdminTopics;
