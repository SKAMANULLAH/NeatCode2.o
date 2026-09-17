import { NavLink, useSearchParams } from "react-router";
import ThemeToggle from "../components/ThemeToggle";
import BrandMark from "../components/BrandMark";

function Landing() {
  const [searchParams] = useSearchParams();
  const googleAuthError = searchParams.get("googleAuthError");

  const highlights = [
    {
      title: "Core CS & Engineering Topics",
      description:
        "Comprehensive revision of OS, DBMS, Networks, System Design, Frontend, and Backend architecture.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      badge: "Curriculum",
    },
    {
      title: "Curated DSA Problem Sheet",
      description:
        "Practice algorithmic patterns in a high-performance in-browser IDE with instant real-world test case evaluation.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      badge: "In-Browser IDE",
    },
    {
      title: "Dynamic Random Quizzes",
      description:
        "Assemble custom timed practice assessments across any combination of subtopics to test your theoretical knowledge.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badge: "Assessment",
    },
    {
      title: "Personal Workspace & Focus Timer",
      description:
        "Save Markdown study notes, bookmark critical documentation, and utilize a movable timer that never stops in background tabs.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badge: "Productivity",
    },
  ];

  return (
    <div className="min-h-screen bg-base-100 flex flex-col text-base-content selection:bg-primary selection:text-primary-content">
      {/* Top Navbar */}
      <header className="border-b border-base-300 bg-base-100/85 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <NavLink
            to="/"
            className="flex items-center gap-2.5 text-base-content text-lg sm:text-xl tracking-tight hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-primary rounded-md px-1"
          >
            <BrandMark size={32} />
            <span>
              <span className="font-extrabold">Neat</span>
              <span className="font-medium opacity-85">Code</span>
            </span>
          </NavLink>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <NavLink
              to="/login"
              className="btn btn-ghost btn-sm font-semibold text-base-content/80 hover:text-base-content"
            >
              Sign In
            </NavLink>
            <NavLink
              to="/signup"
              className="btn btn-primary btn-sm font-semibold shadow-xs"
            >
              Get Started
            </NavLink>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 flex flex-col justify-center">
        {/* Error Alert */}
        {googleAuthError && (
          <div className="max-w-xl mx-auto w-full alert alert-error mb-8 shadow-sm rounded-2xl flex items-center gap-3">
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
            <span className="text-xs sm:text-sm font-medium">
              {googleAuthError}
            </span>
          </div>
        )}

        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Next-Generation Technical Interview Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.15]">
            Master Algorithms, Concepts &{" "}
            <span className="gradient-text">Ace Your Interviews</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-base-content/70 leading-relaxed max-w-2xl mx-auto">
            A comprehensive developer learning suite combining structured computer science notes,
            an in-browser code editor with live test case execution, and deep-work productivity tools.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <NavLink
              to="/signup"
              className="btn btn-primary btn-md sm:btn-lg w-full sm:w-auto px-8 font-bold shadow-md gap-2"
            >
              <span>Get Started Free</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </NavLink>
            <NavLink
              to="/login"
              className="btn btn-outline btn-md sm:btn-lg w-full sm:w-auto px-8 font-semibold border-base-300 hover:border-base-content/40"
            >
              Sign In to Account
            </NavLink>
          </div>
        </section>

        {/* Feature Cards Showcase */}
        <section className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {highlights.map((feat) => (
            <div
              key={feat.title}
              className="interactive-card p-6 rounded-2xl border border-base-300 bg-base-100 hover:border-primary/40 hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {feat.icon}
                  </div>
                  <span className="badge badge-sm badge-ghost border-base-300 text-[11px] font-semibold text-base-content/70">
                    {feat.badge}
                  </span>
                </div>

                <h2 className="text-base font-bold text-base-content tracking-tight">
                  {feat.title}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-base-content/70 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-base-300 py-6 text-center text-xs text-base-content/60">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© NeatCode Platform. Built for developers.</span>
          <div className="flex items-center gap-4 text-base-content/50">
            <NavLink to="/login" className="hover:text-primary transition-colors">Login</NavLink>
            <NavLink to="/signup" className="hover:text-primary transition-colors">Sign Up</NavLink>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
