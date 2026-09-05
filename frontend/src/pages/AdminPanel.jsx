import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axiosClient from "../utils/axiosClient";
import { NavLink, useNavigate } from "react-router";
import toast from "react-hot-toast";
import AppNav from "../components/AppNav";
import { PROBLEM_TAGS, PROBLEM_TAG_OPTIONS } from "../utils/problemTags";

const problemSchema = z.object({
  title: z.string().min(1, "Title is required"),

  description: z.string().min(1, "Description is required"),

  difficulty: z.enum(["easy", "medium", "hard"]),

  tags: z.enum([PROBLEM_TAGS[0], ...PROBLEM_TAGS.slice(1)]),

  videoUrl: z.string().optional().or(z.literal("")),

  visibleTestCases: z
    .array(
      z.object({
        input: z.string().min(1, "Input is required"),
        output: z.string().min(1, "Output is required"),
        explanation: z.string().min(1, "Explanation is required"),
      }),
    )
    .length(3, "Exactly 3 visible test cases are required"),

  hiddenTestCases: z
    .array(
      z.object({
        input: z.string().min(1, "Input is required"),
        output: z.string().min(1, "Output is required"),
      }),
    )
    .length(20, "Exactly 20 hidden test cases are required"),

  startCode: z
    .array(
      z.object({
        language: z.enum(["C++", "Java", "JavaScript"]),
        initialCode: z.string().min(1, "Initial code is required"),
      }),
    )
    .length(3, "All three languages required"),

  referenceSolution: z
    .array(
      z.object({
        language: z.enum(["C++", "Java", "JavaScript"]),
        completeCode: z.string().min(1, "Complete code is required"),
      }),
    )
    .length(3, "All three languages required"),
});

function AdminPanel() {
  const navigate = useNavigate();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(problemSchema),

    defaultValues: {
      videoUrl: "",

      visibleTestCases: Array.from({ length: 3 }, () => ({
        input: "",
        output: "",
        explanation: "",
      })),

      hiddenTestCases: Array.from({ length: 20 }, () => ({
        input: "",
        output: "",
      })),

      startCode: [
        {
          language: "C++",
          initialCode: "",
        },
        {
          language: "Java",
          initialCode: "",
        },
        {
          language: "JavaScript",
          initialCode: "",
        },
      ],

      referenceSolution: [
        {
          language: "C++",
          completeCode: "",
        },
        {
          language: "Java",
          completeCode: "",
        },
        {
          language: "JavaScript",
          completeCode: "",
        },
      ],
    },
  });

  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible,
  } = useFieldArray({
    control,
    name: "visibleTestCases",
  });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden,
  } = useFieldArray({
    control,
    name: "hiddenTestCases",
  });

  const onSubmit = async (data) => {
    try {
      const languageMap = {
        "C++": "cpp17",
        Java: "java",
        JavaScript: "nodejs",
      };

      const payload = {
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        tags: data.tags,
        videoUrl: data.videoUrl || "",
        visibleTestCases: data.visibleTestCases,
        invisibleTestCases: data.hiddenTestCases,
        startCode: data.startCode.map((item) => ({
          language: languageMap[item.language] || item.language,
          initialCode: item.initialCode,
        })),
        referenceSolution: data.referenceSolution.map((item) => ({
          language: languageMap[item.language] || item.language,
          completeCode: item.completeCode,
        })),
      };

      await axiosClient.post("/problem/createProblem", payload);

      toast.success("Problem created successfully!");

      navigate("/");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create problem",
      );
    }
  };

  const getLanguage = (index) => {
    if (index === 0) return "C++";
    if (index === 1) return "Java";
    return "JavaScript";
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col text-base-content">
      <AppNav />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Top Breadcrumbs & Back Button */}
        <div className="flex items-center justify-between gap-4 mb-6">
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
                Create Problem
              </li>
            </ul>
          </nav>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="btn btn-ghost btn-xs sm:btn-sm gap-1 text-base-content/70 hover:text-base-content"
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
            Back to Problems
          </button>
        </div>

        {/* Page Header */}
        <section className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Problem Authoring
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Create New Problem
          </h1>
          <p className="mt-1 text-sm text-base-content/70">
            Add a new coding problem with comprehensive test suites, language
            templates, and reference solutions.
          </p>
        </section>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-8"
          noValidate
        >
          {/* Section 1: Basic Details */}
          <section className="bg-base-100 border border-base-300 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="border-b border-base-300/60 pb-4 mb-6">
              <h2 className="text-lg font-bold text-base-content">
                Basic Information
              </h2>
              <p className="text-xs text-base-content/60 mt-0.5">
                Core descriptive properties and categorizations for this
                challenge.
              </p>
            </div>

            <div className="space-y-5">
              {/* Title */}
              <div className="form-control w-full">
                <label className="label pb-1.5">
                  <span className="label-text font-semibold text-xs text-base-content">
                    Problem Title <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  {...register("title")}
                  placeholder="e.g. Two Sum"
                  className={`input input-bordered w-full text-sm focus:outline-2 focus:outline-primary ${
                    errors.title ? "input-error" : ""
                  }`}
                />
                {errors.title && (
                  <span className="text-xs text-error mt-1 font-medium">
                    {errors.title.message}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="form-control w-full">
                <label className="label pb-1.5">
                  <span className="label-text font-semibold text-xs text-base-content">
                    Problem Description (Markdown supported){" "}
                    <span className="text-error">*</span>
                  </span>
                </label>
                <textarea
                  {...register("description")}
                  rows={6}
                  placeholder="Write the complete problem statement, constraints, and requirements..."
                  className={`textarea textarea-bordered w-full text-sm font-sans focus:outline-2 focus:outline-primary leading-relaxed ${
                    errors.description ? "textarea-error" : ""
                  }`}
                />
                {errors.description && (
                  <span className="text-xs text-error mt-1 font-medium">
                    {errors.description.message}
                  </span>
                )}
              </div>

              {/* Video Editorial */}
              <div className="form-control w-full">
                <label className="label pb-1.5">
                  <span className="label-text font-semibold text-xs text-base-content">
                    Editorial YouTube URL{" "}
                    <span className="text-base-content/40 font-normal">
                      (Optional)
                    </span>
                  </span>
                </label>
                <input
                  {...register("videoUrl")}
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={`input input-bordered w-full text-sm focus:outline-2 focus:outline-primary ${
                    errors.videoUrl ? "input-error" : ""
                  }`}
                />
                {errors.videoUrl && (
                  <span className="text-xs text-error mt-1 font-medium">
                    {errors.videoUrl.message}
                  </span>
                )}
              </div>

              {/* Difficulty & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-control w-full">
                  <label className="label pb-1.5">
                    <span className="label-text font-semibold text-xs text-base-content">
                      Difficulty <span className="text-error">*</span>
                    </span>
                  </label>
                  <select
                    {...register("difficulty")}
                    className="select select-bordered w-full text-sm focus:outline-2 focus:outline-primary"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div className="form-control w-full">
                  <label className="label pb-1.5">
                    <span className="label-text font-semibold text-xs text-base-content">
                      Problem Tag <span className="text-error">*</span>
                    </span>
                  </label>
                  <select
                    {...register("tags")}
                    className="select select-bordered w-full text-sm focus:outline-2 focus:outline-primary"
                  >
                    {PROBLEM_TAG_OPTIONS.map((tag) => (
                      <option key={tag.value} value={tag.value}>
                        {tag.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Visible Test Cases */}
          <section className="bg-base-100 border border-base-300 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-base-300/60 pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-base-content">
                    Visible Test Cases
                  </h2>
                  <span className="badge badge-sm badge-primary font-semibold">
                    {visibleFields.length}/3 required
                  </span>
                </div>
                <p className="text-xs text-base-content/60 mt-0.5">
                  Publicly displayed to the user as problem examples and test
                  runs.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-primary btn-xs sm:btn-sm gap-1 self-start sm:self-auto"
                onClick={() =>
                  appendVisible({
                    input: "",
                    output: "",
                    explanation: "",
                  })
                }
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
                Add Case
              </button>
            </div>

            {visibleFields.length === 0 && (
              <div className="text-center py-8 rounded-xl border border-dashed border-base-300 bg-base-200/40">
                <p className="text-sm font-medium text-base-content/70">
                  No visible test cases added.
                </p>
                <p className="text-xs text-base-content/50 mt-1">
                  Add a test case to begin.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {visibleFields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-xl border border-base-300 bg-base-200/30 p-4 sm:p-5 transition-all"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-base-300/50 mb-3">
                    <span className="text-xs font-bold text-base-content uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary" /> Case{" "}
                      {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeVisible(index)}
                      className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="label-text text-xs font-medium text-base-content/70">
                          Input
                        </span>
                      </label>
                      <textarea
                        {...register(`visibleTestCases.${index}.input`)}
                        placeholder="e.g. nums = [2,7,11,15], target = 9"
                        rows={2}
                        className={`textarea textarea-bordered text-xs font-mono w-full focus:outline-2 focus:outline-primary ${
                          errors.visibleTestCases?.[index]?.input
                            ? "textarea-error"
                            : ""
                        }`}
                      />
                      {errors.visibleTestCases?.[index]?.input && (
                        <span className="text-xs text-error mt-1">
                          {errors.visibleTestCases[index].input.message}
                        </span>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label py-1">
                        <span className="label-text text-xs font-medium text-base-content/70">
                          Expected Output
                        </span>
                      </label>
                      <textarea
                        {...register(`visibleTestCases.${index}.output`)}
                        placeholder="e.g. [0,1]"
                        rows={2}
                        className={`textarea textarea-bordered text-xs font-mono w-full focus:outline-2 focus:outline-primary ${
                          errors.visibleTestCases?.[index]?.output
                            ? "textarea-error"
                            : ""
                        }`}
                      />
                      {errors.visibleTestCases?.[index]?.output && (
                        <span className="text-xs text-error mt-1">
                          {errors.visibleTestCases[index].output.message}
                        </span>
                      )}
                    </div>

                    <div className="form-control sm:col-span-2">
                      <label className="label py-1">
                        <span className="label-text text-xs font-medium text-base-content/70">
                          Explanation
                        </span>
                      </label>
                      <textarea
                        {...register(`visibleTestCases.${index}.explanation`)}
                        placeholder="Explain why this output is expected..."
                        rows={2}
                        className={`textarea textarea-bordered text-xs w-full focus:outline-2 focus:outline-primary ${
                          errors.visibleTestCases?.[index]?.explanation
                            ? "textarea-error"
                            : ""
                        }`}
                      />
                      {errors.visibleTestCases?.[index]?.explanation && (
                        <span className="text-xs text-error mt-1">
                          {errors.visibleTestCases[index].explanation.message}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {errors.visibleTestCases?.message && (
              <p className="text-xs text-error font-medium mt-3">
                {errors.visibleTestCases.message}
              </p>
            )}
          </section>

          {/* Section 3: Hidden Test Cases */}
          <section className="bg-base-100 border border-base-300 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-base-300/60 pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-base-content">
                    Hidden Test Cases
                  </h2>
                  <span className="badge badge-sm badge-ghost border-base-300 font-semibold">
                    {hiddenFields.length}/20 required
                  </span>
                </div>
                <p className="text-xs text-base-content/60 mt-0.5">
                  Used for thorough evaluation upon problem submission.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-primary btn-xs sm:btn-sm gap-1 self-start sm:self-auto"
                onClick={() =>
                  appendHidden({
                    input: "",
                    output: "",
                  })
                }
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
                Add Hidden Case
              </button>
            </div>

            {hiddenFields.length === 0 && (
              <div className="text-center py-8 rounded-xl border border-dashed border-base-300 bg-base-200/40">
                <p className="text-sm font-medium text-base-content/70">
                  No hidden test cases.
                </p>
                <p className="text-xs text-base-content/50 mt-1">
                  Add evaluation cases to continue.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
              {hiddenFields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-xl border border-base-300 bg-base-200/30 p-4 relative transition-all"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-base-300/50 mb-2">
                    <span className="text-xs font-semibold text-base-content/80">
                      Hidden #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeHidden(index)}
                      className="btn btn-ghost btn-xs text-error hover:bg-error/10 px-1"
                      aria-label={`Remove hidden case ${index + 1}`}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <input
                        {...register(`hiddenTestCases.${index}.input`)}
                        placeholder="Raw Input"
                        className={`input input-bordered input-sm text-xs font-mono w-full focus:outline-2 focus:outline-primary ${
                          errors.hiddenTestCases?.[index]?.input
                            ? "input-error"
                            : ""
                        }`}
                      />
                      {errors.hiddenTestCases?.[index]?.input && (
                        <p className="text-[11px] text-error mt-0.5">
                          {errors.hiddenTestCases[index].input.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <input
                        {...register(`hiddenTestCases.${index}.output`)}
                        placeholder="Expected Output"
                        className={`input input-bordered input-sm text-xs font-mono w-full focus:outline-2 focus:outline-primary ${
                          errors.hiddenTestCases?.[index]?.output
                            ? "input-error"
                            : ""
                        }`}
                      />
                      {errors.hiddenTestCases?.[index]?.output && (
                        <p className="text-[11px] text-error mt-0.5">
                          {errors.hiddenTestCases[index].output.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {errors.hiddenTestCases?.message && (
              <p className="text-xs text-error font-medium mt-3">
                {errors.hiddenTestCases.message}
              </p>
            )}
          </section>

          {/* Section 4: Code Templates */}
          <section className="bg-base-100 border border-base-300 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="border-b border-base-300/60 pb-4 mb-6">
              <h2 className="text-lg font-bold text-base-content">
                Code Templates & Solutions
              </h2>
              <p className="text-xs text-base-content/60 mt-0.5">
                Provide default starter boilerplates and verified canonical
                solutions for all supported languages.
              </p>
            </div>

            <div className="space-y-6">
              {[0, 1, 2].map((index) => {
                const language = getLanguage(index);

                return (
                  <div
                    key={index}
                    className="border border-base-300 rounded-xl bg-base-200/20 p-5 space-y-4"
                  >
                    <div className="flex items-center gap-2 border-b border-base-300/50 pb-2.5">
                      <span className="badge badge-primary font-bold text-xs">
                        {language}
                      </span>
                      <span className="text-xs text-base-content/70">
                        Starter template and reference solution
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Initial Code */}
                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text text-xs font-semibold text-base-content">
                            Initial Code Boilerplate{" "}
                            <span className="text-error">*</span>
                          </span>
                        </label>
                        <textarea
                          {...register(`startCode.${index}.initialCode`)}
                          rows={8}
                          placeholder={`Write the ${language} starter code...`}
                          className={`textarea textarea-bordered text-xs font-mono w-full leading-relaxed focus:outline-2 focus:outline-primary ${
                            errors.startCode?.[index]?.initialCode
                              ? "textarea-error"
                              : ""
                          }`}
                        />
                        <input
                          type="hidden"
                          {...register(`startCode.${index}.language`)}
                        />
                        <input
                          type="hidden"
                          {...register(`referenceSolution.${index}.language`)}
                        />
                        {errors.startCode?.[index]?.initialCode && (
                          <p className="text-xs text-error mt-1 font-medium">
                            {errors.startCode[index].initialCode.message}
                          </p>
                        )}
                      </div>

                      {/* Reference Solution */}
                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text text-xs font-semibold text-base-content">
                            Reference Complete Solution{" "}
                            <span className="text-error">*</span>
                          </span>
                        </label>
                        <textarea
                          {...register(
                            `referenceSolution.${index}.completeCode`,
                          )}
                          rows={8}
                          placeholder={`Write the correct ${language} solution...`}
                          className={`textarea textarea-bordered text-xs font-mono w-full leading-relaxed focus:outline-2 focus:outline-primary ${
                            errors.referenceSolution?.[index]?.completeCode
                              ? "textarea-error"
                              : ""
                          }`}
                        />
                        {errors.referenceSolution?.[index]?.completeCode && (
                          <p className="text-xs text-error mt-1 font-medium">
                            {
                              errors.referenceSolution[index].completeCode
                                .message
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Submission Bar */}
          <div className="sticky bottom-4 z-40 bg-base-100/95 backdrop-blur-md border border-base-300 p-4 sm:p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-base-content">
                Ready to publish?
              </h3>
              <p className="text-xs text-base-content/60">
                Review all test suites and solution implementations before
                making this problem live.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="btn btn-ghost btn-sm font-medium flex-1 sm:flex-initial"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary btn-sm px-6 font-semibold flex-1 sm:flex-initial shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <span>Create Problem</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default AdminPanel;
