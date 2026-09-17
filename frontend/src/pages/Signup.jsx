import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useNavigate, useSearchParams } from "react-router";
import { registerUser } from "../authSlice";
import { useEffect, useState } from "react";
import { startGoogleAuth } from "../utils/googleAuth";
import ThemeToggle from "../components/ThemeToggle";
import BrandMark from "../components/BrandMark";

const signupSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required!")
    .min(2, "First name should contain at least 2 characters!")
    .max(20, "First name can have at most 20 characters!"),

  lastName: z
    .union([
      z.literal(""),
      z
        .string()
        .min(3, "Last name should contain at least 3 characters!")
        .max(20, "Last name can have at most 20 characters!"),
    ])
    .optional(),

  email: z
    .string()
    .min(1, "Email is required!")
    .email("Please enter a valid email address!"),

  password: z
    .string()
    .min(1, "Password is required!")
    .min(8, "Password should have at least 8 characters!"),
});

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const googleAuthError = searchParams.get("googleAuthError");
  const { isAuthenticated, loading, error } = useSelector(
    (state) => state.auth,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(signupSchema) });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    const payload = {
      firstName: data.firstName,
      email: data.email,
      password: data.password,
    };

    if (data.lastName) {
      payload.lastName = data.lastName;
    }

    dispatch(registerUser(payload));
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 text-base-content selection:bg-primary selection:text-primary-content relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] opacity-70" />
      </div>

      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <NavLink
          to="/"
          className="inline-flex items-center gap-2.5 text-xl font-bold tracking-tight hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-primary rounded-md px-1"
        >
          <BrandMark size={36} className="rounded-xl" />
          <span className="text-2xl">
            <span className="font-extrabold text-primary">Neat</span>
            <span className="font-normal opacity-90">Code</span>
          </span>
        </NavLink>
        <h1 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight text-base-content">
          Create an account
        </h1>
        <p className="mt-1 text-sm text-base-content/70">
          Get started with your technical interview preparation.
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full sm:max-w-md bg-base-100 border border-base-300 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
        {/* Error Feedback Alerts */}
        {(error || googleAuthError) && (
          <div className="alert alert-error text-xs sm:text-sm mb-6 rounded-2xl shadow-xs flex items-start gap-2.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-4 w-4 mt-0.5"
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
            <span className="leading-tight">{error || googleAuthError}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          {/* Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* First Name Field */}
            <div className="form-control w-full">
              <label className="label pb-1.5" htmlFor="firstName">
                <span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/70">
                  First Name <span className="text-error">*</span>
                </span>
              </label>
              <input
                id="firstName"
                {...register("firstName")}
                type="text"
                placeholder="Linus"
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

            {/* Last Name Field */}
            <div className="form-control w-full">
              <label className="label pb-1.5" htmlFor="lastName">
                <span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/70">
                  Last Name{" "}
                  <span className="text-base-content/40 font-normal">
                    (Opt)
                  </span>
                </span>
              </label>
              <input
                id="lastName"
                {...register("lastName")}
                type="text"
                placeholder="Torvalds"
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
              <span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/70">
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
              <span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/70">
                Password <span className="text-error">*</span>
              </span>
            </label>
            <div className="relative">
              <input
                id="password"
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                className={`input input-bordered w-full pl-10 pr-10 text-sm transition-all focus:outline-2 focus:outline-primary ${
                  errors.password ? "input-error" : ""
                }`}
                aria-invalid={errors.password ? "true" : "false"}
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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <button
                type="button"
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full text-sm font-bold shadow-md mt-2"
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-xs" />
                <span>Creating Account...</span>
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="divider text-xs uppercase tracking-wider text-base-content/40 my-6">
          or continue with
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={startGoogleAuth}
          className="btn btn-outline border-base-300 hover:bg-base-200/60 hover:border-base-300 text-base-content w-full text-xs font-semibold gap-2.5 shadow-2xs"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign up with Google</span>
        </button>

        {/* Footer Link */}
        <p className="mt-6 text-center text-xs text-base-content/70">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => {
              navigate("/login");
            }}
            className="font-bold text-primary hover:underline ml-1 focus-visible:outline-2 focus-visible:outline-primary rounded-xs"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}

export default Signup;
