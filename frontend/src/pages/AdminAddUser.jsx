import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { NavLink } from "react-router";
import axiosClient from "../utils/axiosClient";
import AppNav from "../components/AppNav";
import toast from "react-hot-toast";

const addUserSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name should contain at least 2 characters!")
    .max(20, "First name can have at most 20 characters!"),
  lastName: z.union([z.literal(""), z.string().min(3).max(20)]).optional(),
  email: z.string().email("Please enter a valid email address!"),
  password: z.string().min(8, "Password should have at least 8 characters!"),
  role: z.enum(["user", "admin"]),
});

function AdminAddUser() {
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "user",
    },
  });

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      const payload = {
        firstName: data.firstName,
        email: data.email,
        password: data.password,
        role: data.role,
      };

      if (data.lastName) {
        payload.lastName = data.lastName;
      }

      await axiosClient.post("/user/add", payload);
      toast.success("User added successfully");
      reset();
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Failed to add user",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col text-base-content">
      <AppNav />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
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
            <li className="text-base-content font-semibold">Add User</li>
          </ul>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            User Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Add New User
          </h1>
          <p className="mt-1.5 text-sm text-base-content/70">
            Provision a new student or administrator account with credentials
            and platform role permissions.
          </p>
        </header>

        {/* Card Form */}
        <div className="bg-base-100 border border-base-300 rounded-2xl p-6 sm:p-8 shadow-xs">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
            noValidate
          >
            {/* Name Fields Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="form-control w-full">
                <label className="label pb-1.5" htmlFor="firstName">
                  <span className="label-text font-semibold text-xs text-base-content">
                    First Name <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  id="firstName"
                  {...register("firstName")}
                  type="text"
                  placeholder="e.g. Linus"
                  className={`input input-bordered w-full text-sm transition-all focus:outline-2 focus:outline-primary ${
                    errors.firstName ? "input-error" : ""
                  }`}
                  aria-invalid={errors.firstName ? "true" : "false"}
                />
                {errors.firstName && (
                  <span className="text-xs text-error mt-1.5 flex items-center gap-1 font-medium">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5 shrink-0"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.firstName.message}
                  </span>
                )}
              </div>

              <div className="form-control w-full">
                <label className="label pb-1.5" htmlFor="lastName">
                  <span className="label-text font-semibold text-xs text-base-content">
                    Last Name{" "}
                    <span className="text-base-content/40 font-normal">
                      (Optional)
                    </span>
                  </span>
                </label>
                <input
                  id="lastName"
                  {...register("lastName")}
                  type="text"
                  placeholder="e.g. Torvalds"
                  className={`input input-bordered w-full text-sm transition-all focus:outline-2 focus:outline-primary ${
                    errors.lastName ? "input-error" : ""
                  }`}
                  aria-invalid={errors.lastName ? "true" : "false"}
                />
                {errors.lastName && (
                  <span className="text-xs text-error mt-1.5 flex items-center gap-1 font-medium">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5 shrink-0"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.lastName.message}
                  </span>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="form-control w-full">
              <label className="label pb-1.5" htmlFor="email">
                <span className="label-text font-semibold text-xs text-base-content">
                  Email Address <span className="text-error">*</span>
                </span>
              </label>
              <div className="relative">
                <input
                  id="email"
                  {...register("email")}
                  type="email"
                  placeholder="developer@example.com"
                  className={`input input-bordered w-full pl-10 text-sm transition-all focus:outline-2 focus:outline-primary ${
                    errors.email ? "input-error" : ""
                  }`}
                  aria-invalid={errors.email ? "true" : "false"}
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206"
                  />
                </svg>
              </div>
              {errors.email && (
                <span className="text-xs text-error mt-1.5 flex items-center gap-1 font-medium">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5 shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="form-control w-full">
              <label className="label pb-1.5" htmlFor="password">
                <span className="label-text font-semibold text-xs text-base-content">
                  Temporary Password <span className="text-error">*</span>
                </span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  className={`input input-bordered w-full pr-10 text-sm transition-all focus:outline-2 focus:outline-primary ${
                    errors.password ? "input-error" : ""
                  }`}
                  aria-invalid={errors.password ? "true" : "false"}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
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
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  ) : (
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="text-xs text-error mt-1.5 flex items-center gap-1 font-medium">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5 shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.password.message}
                </span>
              )}
            </div>

            {/* Role Select */}
            <div className="form-control w-full">
              <label className="label pb-1.5" htmlFor="role">
                <span className="label-text font-semibold text-xs text-base-content">
                  System Role <span className="text-error">*</span>
                </span>
              </label>
              <select
                id="role"
                {...register("role")}
                className="select select-bordered w-full text-sm transition-all focus:outline-2 focus:outline-primary font-normal"
              >
                <option value="user">User (Standard Student Access)</option>
                <option value="admin">
                  Admin (Full Administrative Rights)
                </option>
              </select>
              <span className="text-xs text-base-content/50 mt-1.5">
                Admins have write permissions to problems, topics, and user
                management.
              </span>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-base-300 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
              <NavLink
                to="/admin"
                className="btn btn-ghost btn-sm sm:btn-md font-medium text-base-content/70 hover:text-base-content"
              >
                Cancel
              </NavLink>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-sm sm:btn-md font-semibold gap-2 shadow-xs min-w-[130px]"
              >
                {submitting ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
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
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      />
                    </svg>
                    <span>Add User</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default AdminAddUser;
