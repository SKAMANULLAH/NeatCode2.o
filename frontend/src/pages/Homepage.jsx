import { NavLink } from "react-router";
import { useSelector } from "react-redux";
import AppNav from "../components/AppNav";
import { useTimer } from "../context/useTimer";
import { formatTimerDisplay } from "../utils/timerUtils";

function Homepage() {
  const { user } = useSelector((state) => state.auth);
  const { timeLeft, isTimerRunning, toggleFloating, isFloating } = useTimer();

  const cards = [
    {
      to: "/topics",
      title: "Curriculum Topics",
      description:
        "Master core CS, Operating Systems, Networks, DBMS, System Design, Frontend, and Backend architecture.",
      badge: "Curriculum",
      actionText: "Explore Topics",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      to: "/dsa",
      title: "DSA Problem Sheet",
      description:
        "Practice coding interview problems in an in-browser Monaco IDE with live execution against real test cases.",
      badge: "Algorithms",
      actionText: "Solve Problems",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
    },
    {
      to: "/quizzes",
      title: "Practice Quizzes",
      description:
        "Assemble customizable randomized assessments across any subtopics and evaluate your theoretical knowledge.",
      badge: "Assessment",
      actionText: "Start Quiz",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      to: "/workspace",
      title: "Personal Workspace",
      description:
        "Draft Markdown notes, save web bookmarks with favicons, and manage your floating multi-tab focus timer.",
      badge: "Productivity",
      actionText: "Open Workspace",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h6l4 4v12a2 2 0 01-2 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 3v4h4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-base-100 flex flex-col text-base-content">
      <AppNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Welcome Header */}
        <section className="mb-8 md:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>Developer Dashboard</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-base-content">
                Welcome back, {user?.firstName || "Developer"} 
              </h1>
              <p className="mt-1.5 text-base text-base-content/70 max-w-xl">
                Track your interview preparation, practice algorithms, and organize your study notes.
              </p>
            </div>

            {/* Focus Timer Status Pill */}
            <div className="bg-base-100 border border-base-300 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs self-start md:self-auto">
              
              <div>
                <div className="text-[11px] text-base-content/50 uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <span>Focus Timer</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isTimerRunning ? "bg-primary animate-pulse" : "bg-base-content/30"
                    }`}
                  />
                </div>
                <div className="text-sm font-mono font-extrabold text-primary">
                  {formatTimerDisplay(timeLeft)}
                </div>
              </div>

              <button
                type="button"
                onClick={toggleFloating}
                className={`btn btn-xs rounded-lg font-semibold ml-2 ${
                  isFloating ? "btn-outline btn-primary" : "btn-primary"
                }`}
              >
                {isFloating ? "Hide Float" : "Float"}
              </button>
            </div>
          </div>
        </section>

        {/* Action Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((card) => (
            <NavLink
              key={card.to}
              to={card.to}
              className="interactive-card group relative flex flex-col justify-between p-6 rounded-2xl border border-base-300 bg-base-100 hover:border-primary/40 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-105 duration-200">
                    {card.icon}
                  </div>
                  <span className="badge badge-sm badge-ghost font-semibold text-xs text-base-content/70 border-base-300">
                    {card.badge}
                  </span>
                </div>

                <h2 className="text-lg font-bold tracking-tight text-base-content group-hover:text-primary transition-colors flex items-center gap-2">
                  {card.title}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-base-content/70 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-base-200 flex items-center justify-between text-xs font-bold text-primary">
                <span>{card.actionText}</span>
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
