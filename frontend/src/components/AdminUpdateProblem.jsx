import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axiosClient from "../utils/axiosClient";
import { NavLink, useNavigate, useParams } from "react-router";
import toast from "react-hot-toast";
import { PROBLEM_TAGS, PROBLEM_TAG_OPTIONS } from "../utils/problemTags";
import AppNav from "../components/AppNav";

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
        language: z.enum(["cpp17", "java", "nodejs"]),
        initialCode: z.string().min(1, "Initial code is required"),
      }),
    )
    .length(3, "All three languages required"),

  referenceSolution: z
    .array(
      z.object({
        language: z.enum(["cpp17", "java", "nodejs"]),
        completeCode: z.string().min(1, "Complete code is required"),
      }),
    )
    .length(3, "All three languages required"),
});

function AdminUpdateProblem() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(problemSchema),

    defaultValues: {
      title: "",
      description: "",
      difficulty: "easy",
      tags: "array",
      videoUrl: "",
      visibleTestCases: [],
      hiddenTestCases: [],
      startCode: [
        {
          language: "cpp17",
          initialCode: "",
        },
        {
          language: "java",
          initialCode: "",
        },
        {
          language: "nodejs",
          initialCode: "",
        },
      ],
      referenceSolution: [
        {
          language: "cpp17",
          completeCode: "",
        },
        {
          language: "java",
          completeCode: "",
        },
        {
          language: "nodejs",
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

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setLoading(true);

        const { data } = await axiosClient.get(
          `/problem/fetchProblemForUpdate/${problemId}`,
        );

        reset({
          title: data.title || "",
          description: data.description || "",
          difficulty: data.difficulty || "easy",
          tags: data.tags || "array",
          videoUrl: data.videoUrl || "",
          visibleTestCases: data.visibleTestCases || [],
          hiddenTestCases: data.invisibleTestCases || [],
          startCode:
            data.startCode?.length === 3
              ? data.startCode
              : [
                  {
                    language: "cpp17",
                    initialCode: "",
                  },
                  {
                    language: "java",
                    initialCode: "",
                  },
                  {
                    language: "nodejs",
                    initialCode: "",
                  },
                ],
          referenceSolution:
            data.referenceSolution?.length === 3
              ? data.referenceSolution
              : [
                  {
                    language: "cpp17",
                    completeCode: "",
                  },
                  {
                    language: "java",
                    completeCode: "",
                  },
                  {
                    language: "nodejs",
                    completeCode: "",
                  },
                ],
        });
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || "Failed to fetch problem");
        navigate("/admin/update");
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId, reset, navigate]);

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);

      const languageMap = {
        "C++": "cpp17",
        Java: "java",
        JavaScript: "nodejs",
        cpp17: "cpp17",
        java: "java",
        nodejs: "nodejs",
      };

      const formattedData = {
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

      await axiosClient.patch(
        `/problem/updateProblem/${problemId}`,
        formattedData,
      );

      toast.success("Problem updated successfully!");
      navigate("/admin/update");
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update problem",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getLanguage = (index) => {
    if (index === 0) return "C++";
    if (index === 1) return "Java";
    return "JavaScript";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex flex-col text-base-content">
        <AppNav />
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
          <span className="loading loading-spinner loading-lg text-primary mb-3" />
          <p className="text-sm font-medium text-base-content/70">
            Loading problem details for editing...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 flex flex-col text-base-content selection:bg-primary selection:text-primary-content">
      <AppNav />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Navigation Breadcrumbs & Back */}
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
              <li>
                <NavLink
                  to="/admin/update"
                  className="hover:text-primary transition-colors"
                >
                  Update Problems
                </NavLink>
              </li>
              <li>/</li>
              <li className="text-base-content font-semibold">Edit Problem</li>
            </ul>
          </nav>

          <button
            type="button"
            onClick={() => navigate("/admin/update")}
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
            <span>Back to Problems</span>
          </button>
        </div>

        {/* Page Header */}
        <section className="mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Admin Editor
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-base-content">
            Update Problem
          </h1>
          <p className="mt-2 text-base text-base-content/70 max-w-2xl">
            Modify the challenge statement, validation test benches, initial
            stubs, and canonical solutions.
          </p>
        </section>

        <form
          onSubmit={handleSubmit(onSubmit, (errors) => {
            console.log("FORM VALIDATION ERRORS:", errors);
            toast.error("Please fix the validation errors before submitting.");
          })}
          className="space-y-8"
          noValidate
        >
          {/* Section 1: Basic Information */}
          <section className="bg-base-100 border border-base-300 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-base-300/60 pb-3">
              <h2 className="text-lg font-bold text-base-content">
                Basic Information
              </h2>
              <p className="text-xs text-base-content/60 mt-0.5">
                Set the core metadata and visual description of the problem.
              </p>
            </div>

            {/* Problem Title */}
            <div className="form-control w-full">
              <label className="label pb-1.5">
                <span className="label-text font-semibold text-xs text-base-content">
                  Problem Title <span className="text-error">*</span>
                </span>
              </label>
              <input
                {...register("title")}
                placeholder="e.g. Two Sum"
                className={`input input-bordered w-full text-sm transition-all focus:outline-2 focus:outline-primary ${
                  errors.title ? "input-error" : ""
                }`}
              />
              {errors.title && (
                <span className="text-xs text-error mt-1.5 flex items-center gap-1 font-medium">
                  {errors.title.message}
                </span>
              )}
            </div>

            {/* Problem Description */}
            <div className="form-control w-full">
              <label className="label pb-1.5">
                <span className="label-text font-semibold text-xs text-base-content">
                  Problem Description <span className="text-error">*</span>
                </span>
              </label>
              <textarea
                {...register("description")}
                rows={6}
                placeholder="Write the complete problem statement in markdown..."
                className={`textarea textarea-bordered w-full font-mono text-xs sm:text-sm leading-relaxed transition-all focus:outline-2 focus:outline-primary ${
                  errors.description ? "textarea-error" : ""
                }`}
              />
              {errors.description && (
                <span className="text-xs text-error mt-1.5 flex items-center gap-1 font-medium">
                  {errors.description.message}
                </span>
              )}
            </div>

            {/* Video URL */}
            <div className="form-control w-full">
              <label className="label pb-1.5">
                <span className="label-text font-semibold text-xs text-base-content">
                  Editorial Video URL{" "}
                  <span className="text-base-content/40 font-normal">
                    (Optional YouTube Link)
                  </span>
                </span>
              </label>
              <input
                {...register("videoUrl")}
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                className={`input input-bordered w-full text-sm transition-all focus:outline-2 focus:outline-primary ${
                  errors.videoUrl ? "input-error" : ""
                }`}
              />
              {errors.videoUrl && (
                <span className="text-xs text-error mt-1.5 flex items-center gap-1 font-medium">
                  {errors.videoUrl.message}
                </span>
              )}
            </div>

            {/* Difficulty & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label pb-1.5">
                  <span className="label-text font-semibold text-xs text-base-content">
                    Difficulty Tier
                  </span>
                </label>
                <select
                  {...register("difficulty")}
                  className="select select-bordered w-full text-sm capitalize focus:outline-2 focus:outline-primary"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                {errors.difficulty && (
                  <span className="text-xs text-error mt-1.5 font-medium">
                    {errors.difficulty.message}
                  </span>
                )}
              </div>

              <div className="form-control w-full">
                <label className="label pb-1.5">
                  <span className="label-text font-semibold text-xs text-base-content">
                    Primary Topic Tag
                  </span>
                </label>
                <select
                  {...register("tags")}
                  className="select select-bordered w-full text-sm capitalize focus:outline-2 focus:outline-primary"
                >
                  {PROBLEM_TAG_OPTIONS.map((tag) => (
                    <option key={tag.value} value={tag.value}>
                      {tag.label}
                    </option>
                  ))}
                </select>
                {errors.tags && (
                  <span className="text-xs text-error mt-1.5 font-medium">
                    {errors.tags.message}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Section 2: Test Cases */}
          <section className="bg-base-100 border border-base-300 rounded-2xl p-6 sm:p-8 shadow-xs space-y-8">
            <div className="border-b border-base-300/60 pb-3">
              <h2 className="text-lg font-bold text-base-content">
                Verification Test Benches
              </h2>
              <p className="text-xs text-base-content/60 mt-0.5">
                Exact specifications: Exactly 3 visible examples and 20 hidden
                evaluation suites.
              </p>
            </div>

            {/* Visible Test Cases */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
                    <span>Visible Test Cases</span>
                    <span className="badge badge-sm badge-ghost border-base-300 font-mono text-xs">
                      {visibleFields.length} / 3
                    </span>
                  </h3>
                  <p className="text-xs text-base-content/60 mt-0.5">
                    Rendered directly to users as examples with explanations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    appendVisible({
                      input: "",
                      output: "",
                      explanation: "",
                    })
                  }
                  className="btn btn-outline btn-xs sm:btn-sm font-semibold gap-1 self-start sm:self-auto"
                  disabled={visibleFields.length >= 3}
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>Add Example Case</span>
                </button>
              </div>

              {visibleFields.length === 0 && (
                <div className="text-center py-8 rounded-xl border border-dashed border-base-300 bg-base-200/20 text-xs text-base-content/60">
                  No visible test cases configured. Exactly 3 are required.
                </div>
              )}

              <div className="space-y-4">
                {visibleFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-4 sm:p-5 rounded-xl border border-base-300 bg-base-200/20 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-base-300/60 pb-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-base-content/70">
                        Example Case #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeVisible(index)}
                        className="btn btn-ghost btn-xs text-error hover:bg-error/10 font-semibold"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="form-control">
                        <label className="label py-0 pb-1">
                          <span className="label-text text-xs font-semibold text-base-content/70">
                            Input <span className="text-error">*</span>
                          </span>
                        </label>
                        <textarea
                          {...register(`visibleTestCases.${index}.input`)}
                          rows={2}
                          placeholder="Input arguments or stdin..."
                          className={`textarea textarea-bordered w-full font-mono text-xs ${
                            errors.visibleTestCases?.[index]?.input
                              ? "textarea-error"
                              : ""
                          }`}
                        />
                        {errors.visibleTestCases?.[index]?.input && (
                          <span className="text-xs text-error mt-1 font-medium">
                            {errors.visibleTestCases[index].input.message}
                          </span>
                        )}
                      </div>

                      <div className="form-control">
                        <label className="label py-0 pb-1">
                          <span className="label-text text-xs font-semibold text-base-content/70">
                            Expected Output{" "}
                            <span className="text-error">*</span>
                          </span>
                        </label>
                        <textarea
                          {...register(`visibleTestCases.${index}.output`)}
                          rows={2}
                          placeholder="Expected return or stdout..."
                          className={`textarea textarea-bordered w-full font-mono text-xs ${
                            errors.visibleTestCases?.[index]?.output
                              ? "textarea-error"
                              : ""
                          }`}
                        />
                        {errors.visibleTestCases?.[index]?.output && (
                          <span className="text-xs text-error mt-1 font-medium">
                            {errors.visibleTestCases[index].output.message}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label py-0 pb-1">
                        <span className="label-text text-xs font-semibold text-base-content/70">
                          Explanation <span className="text-error">*</span>
                        </span>
                      </label>
                      <textarea
                        {...register(`visibleTestCases.${index}.explanation`)}
                        rows={2}
                        placeholder="Explain why this output is produced..."
                        className={`textarea textarea-bordered w-full text-xs ${
                          errors.visibleTestCases?.[index]?.explanation
                            ? "textarea-error"
                            : ""
                        }`}
                      />
                      {errors.visibleTestCases?.[index]?.explanation && (
                        <span className="text-xs text-error mt-1 font-medium">
                          {errors.visibleTestCases[index].explanation.message}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {errors.visibleTestCases?.message && (
                <div className="alert alert-error text-xs rounded-xl shadow-xs py-2">
                  <span>{errors.visibleTestCases.message}</span>
                </div>
              )}
            </div>

            {/* Hidden Test Cases */}
            <div className="space-y-4 pt-4 border-t border-base-300/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
                    <span>Hidden Test Cases</span>
                    <span className="badge badge-sm badge-ghost border-base-300 font-mono text-xs">
                      {hiddenFields.length} / 20
                    </span>
                  </h3>
                  <p className="text-xs text-base-content/60 mt-0.5">
                    Evaluated during final submissions to verify edge cases and
                    scale.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    appendHidden({
                      input: "",
                      output: "",
                    })
                  }
                  className="btn btn-outline btn-xs sm:btn-sm font-semibold gap-1 self-start sm:self-auto"
                  disabled={hiddenFields.length >= 20}
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>Add Hidden Case</span>
                </button>
              </div>

              {hiddenFields.length === 0 && (
                <div className="text-center py-8 rounded-xl border border-dashed border-base-300 bg-base-200/20 text-xs text-base-content/60">
                  No hidden test cases configured. Exactly 20 are required.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {hiddenFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-3.5 rounded-xl border border-base-300 bg-base-200/20 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-base-content/70">
                        Hidden #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeHidden(index)}
                        className="btn btn-ghost btn-xs text-error hover:bg-error/10 font-semibold"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="form-control">
                        <textarea
                          {...register(`hiddenTestCases.${index}.input`)}
                          rows={2}
                          placeholder="Input payload..."
                          className={`textarea textarea-bordered w-full font-mono text-xs ${
                            errors.hiddenTestCases?.[index]?.input
                              ? "textarea-error"
                              : ""
                          }`}
                        />
                        {errors.hiddenTestCases?.[index]?.input && (
                          <span className="text-xs text-error mt-1 font-medium">
                            {errors.hiddenTestCases[index].input.message}
                          </span>
                        )}
                      </div>

                      <div className="form-control">
                        <textarea
                          {...register(`hiddenTestCases.${index}.output`)}
                          rows={2}
                          placeholder="Expected result..."
                          className={`textarea textarea-bordered w-full font-mono text-xs ${
                            errors.hiddenTestCases?.[index]?.output
                              ? "textarea-error"
                              : ""
                          }`}
                        />
                        {errors.hiddenTestCases?.[index]?.output && (
                          <span className="text-xs text-error mt-1 font-medium">
                            {errors.hiddenTestCases[index].output.message}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {errors.hiddenTestCases?.message && (
                <div className="alert alert-error text-xs rounded-xl shadow-xs py-2">
                  <span>{errors.hiddenTestCases.message}</span>
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Code Templates & Reference Solutions */}
          <section className="bg-base-100 border border-base-300 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-base-300/60 pb-3">
              <h2 className="text-lg font-bold text-base-content">
                Code Stubs & Solutions
              </h2>
              <p className="text-xs text-base-content/60 mt-0.5">
                Maintain starter templates and verified reference solutions
                across all supported languages.
              </p>
            </div>

            <div className="space-y-6">
              {[0, 1, 2].map((index) => {
                const language = getLanguage(index);

                return (
                  <div
                    key={index}
                    className="p-5 rounded-2xl border border-base-300 bg-base-200/20 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-base-300/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-primary badge-sm font-mono font-bold">
                          {language}
                        </span>
                        <span className="text-xs text-base-content/60">
                          Template & Canonical Answer
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Initial Code */}
                      <div className="form-control">
                        <label className="label py-0 pb-1">
                          <span className="label-text text-xs font-semibold text-base-content/80">
                            Starter Stub ({language}){" "}
                            <span className="text-error">*</span>
                          </span>
                        </label>
                        <textarea
                          {...register(`startCode.${index}.initialCode`)}
                          rows={10}
                          placeholder={`// Initial ${language} starter signature...`}
                          className={`textarea textarea-bordered w-full font-mono text-xs leading-relaxed ${
                            errors.startCode?.[index]?.initialCode
                              ? "textarea-error"
                              : ""
                          }`}
                        />
                        <input
                          type="hidden"
                          {...register(`startCode.${index}.language`)}
                        />
                        {errors.startCode?.[index]?.initialCode && (
                          <span className="text-xs text-error mt-1 font-medium">
                            {errors.startCode[index].initialCode.message}
                          </span>
                        )}
                      </div>

                      {/* Reference Solution */}
                      <div className="form-control">
                        <label className="label py-0 pb-1">
                          <span className="label-text text-xs font-semibold text-base-content/80">
                            Canonical Solution ({language}){" "}
                            <span className="text-error">*</span>
                          </span>
                        </label>
                        <textarea
                          {...register(
                            `referenceSolution.${index}.completeCode`,
                          )}
                          rows={10}
                          placeholder={`// Complete working ${language} implementation...`}
                          className={`textarea textarea-bordered w-full font-mono text-xs leading-relaxed ${
                            errors.referenceSolution?.[index]?.completeCode
                              ? "textarea-error"
                              : ""
                          }`}
                        />
                        <input
                          type="hidden"
                          {...register(`referenceSolution.${index}.language`)}
                        />
                        {errors.referenceSolution?.[index]?.completeCode && (
                          <span className="text-xs text-error mt-1 font-medium">
                            {
                              errors.referenceSolution[index].completeCode
                                .message
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Action Sticky Footer */}
          <div className="sticky bottom-4 z-40 bg-base-100/95 backdrop-blur-md border border-base-300 p-4 sm:p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-base-content">
                Ready to apply changes?
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">
                Verify that 3 visible and 20 hidden test cases are populated.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => navigate("/admin/update")}
                className="btn btn-ghost btn-sm font-medium"
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-sm px-6 font-semibold shadow-xs gap-2 min-w-[140px]"
              >
                {submitting ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Update Problem</span>
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
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default AdminUpdateProblem;
