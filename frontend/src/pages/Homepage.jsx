import { NavLink } from "react-router";
import AppNav from "../components/AppNav";

function Homepage() {
  const cards = [
    {
      to: "/topics",
      title: "Topics",
      description:
        "Revise core CS, Frontend, Backend, DevOps Stuffs, Aptitude, System Design and many more...",
      badge: "Revise",
      icon: (
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
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
    },
    {
      to: "/dsa",
      title: "DSA",
      description:
        "Open the comprehensive DSA sheet and tackle curated practice problems.",
      badge: "Code",
      icon: (
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
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      ),
    },
    {
      to: "/quizzes",
      title: "Practice Quiz",
      description:
        "Test your theoretical understanding with interactive quizzes.",
      badge: "Assessments",
      icon: (
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-base-100 flex flex-col text-base-content">
      <AppNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14">
        {/* Header / Hero Section */}
        <section className="mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Dashboard
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Home
          </h1>
          <p className="mt-2 text-base sm:text-lg text-base-content/70 max-w-xl">
            Choose a section to continue your structured learning and practice.
          </p>
        </section>

        {/* Action Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {cards.map((card) => (
            <NavLink
              key={card.to}
              to={card.to}
              className="group relative flex flex-col justify-between p-6 rounded-2xl border border-base-300 bg-base-100 hover:bg-base-200/50 transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-105 duration-200">
                    {card.icon}
                  </div>
                  <span className="badge badge-sm badge-ghost font-medium text-xs text-base-content/70 border-base-300">
                    {card.badge}
                  </span>
                </div>

                <h2 className="text-xl font-bold tracking-tight text-base-content group-hover:text-primary transition-colors flex items-center gap-2">
                  {card.title}
                </h2>
                <p className="mt-2 text-sm text-base-content/70 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-base-300/60 flex items-center justify-between text-xs font-semibold text-primary">
                <span>Continue</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 transform transition-transform group-hover:translate-x-1 duration-150"
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
              </div>
            </NavLink>
          ))}
        </section>
      </main>
    </div>
  );
}

export default Homepage;
