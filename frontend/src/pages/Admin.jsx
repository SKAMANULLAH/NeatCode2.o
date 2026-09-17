import { NavLink } from "react-router";
import AppNav from "../components/AppNav";

function Admin() {

  const adminOptions = [
    {
      id: "create",
      title: "Create Problem",
      description: "Add a new coding problem to the platform",
      route: "/admin/create",
      category: "Problems",
      badgeClass: "badge-primary",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
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
      ),
    },
    {
      id: "update",
      title: "Update Problem",
      description: "Edit existing problems and their details",
      route: "/admin/update",
      category: "Problems",
      badgeClass: "badge-primary",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
    },
    {
      id: "delete",
      title: "Delete Problem",
      description: "Remove problems from the platform",
      route: "/admin/delete",
      category: "Danger Zone",
      badgeClass: "badge-error",
      isDestructive: true,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      ),
    },
    {
      id: "users",
      title: "Manage Users",
      description: "View all users in the database and delete accounts",
      route: "/admin/users",
      category: "Accounts",
      badgeClass: "badge-primary",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
    },
    {
      id: "user",
      title: "Add User",
      description: "Create a new user account",
      route: "/admin/user",
      category: "Accounts",
      badgeClass: "badge-ghost",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
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
      ),
    },
    {
      id: "topics",
      title: "Manage Topics",
      description: "Create and update topics and subtopics",
      route: "/admin/topics",
      category: "Curriculum",
      badgeClass: "badge-ghost",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
    },
    {
      id: "quizzes",
      title: "Manage Quizzes",
      description: "Create and update quizzes",
      route: "/admin/quizzes",
      category: "Curriculum",
      badgeClass: "badge-ghost",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-base-100 flex flex-col text-base-content">
      <AppNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header Section */}
        <section className="mb-8 md:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Administrative Controls
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-base-content">
            Admin Panel
          </h1>
          <p className="mt-2 text-base text-base-content/70 max-w-2xl">
            Manage coding problems, organize curriculum topics, oversee
            assessments, and configure platform settings.
          </p>
        </section>

        {/* Management Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {adminOptions.map((option) => {
            const isDanger = option.isDestructive;

            return (
              <div
                key={option.id}
                className={`group relative flex flex-col justify-between p-6 rounded-2xl border bg-base-100 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  isDanger
                    ? "border-base-300 hover:border-error/50 hover:bg-error/[0.02]"
                    : "border-base-300 hover:border-primary/40 hover:bg-base-200/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 duration-200 ${
                        isDanger
                          ? "bg-error/10 text-error"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {option.icon}
                    </div>
                    <span
                      className={`badge badge-sm font-medium text-xs ${
                        isDanger
                          ? "badge-error/10 text-error border-error/20"
                          : "badge-ghost border-base-300 text-base-content/70"
                      }`}
                    >
                      {option.category}
                    </span>
                  </div>

                  <h2
                    className={`text-lg font-bold tracking-tight transition-colors ${
                      isDanger
                        ? "text-base-content group-hover:text-error"
                        : "text-base-content group-hover:text-primary"
                    }`}
                  >
                    {option.title}
                  </h2>
                  <p className="mt-1.5 text-sm text-base-content/70 leading-relaxed">
                    {option.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-base-300/60">
                  <NavLink
                    to={option.route}
                    className={`btn btn-sm w-full gap-2 font-medium transition-all ${
                      isDanger
                        ? "btn-outline btn-error hover:text-white"
                        : "btn-primary hover:shadow-xs"
                    }`}
                  >
                    <span>{option.title}</span>
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </NavLink>
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}

export default Admin;
