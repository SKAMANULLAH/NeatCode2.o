import { NavLink } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../authSlice";
import ThemeToggle from "./ThemeToggle";
import BrandMark from "./BrandMark";

function AppNav() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
      isActive
        ? "bg-primary/10 text-primary shadow-2xs"
        : "text-base-content/65 hover:text-base-content hover:bg-base-200/60"
    }`;

  const renderNavLinks = () => (
    <>
      <li>
        <NavLink to="/" end className={navLinkClass}>
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
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span>Home</span>
        </NavLink>
      </li>
      <li>
        <NavLink to="/topics" className={navLinkClass}>
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
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <span>Topics</span>
        </NavLink>
      </li>
      <li>
        <NavLink to="/dsa" className={navLinkClass}>
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
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
          <span>DSA</span>
        </NavLink>
      </li>
      <li>
        <NavLink to="/quizzes" className={navLinkClass}>
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Practice Quiz</span>
        </NavLink>
      </li>
      <li>
        <NavLink to="/workspace" className={navLinkClass}>
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h6l4 4v12a2 2 0 01-2 2z"
            />
          </svg>
          <span>Workspace</span>
        </NavLink>
      </li>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-base-300 bg-base-100/90 backdrop-blur-xl transition-colors">
      <nav
        aria-label="Main Navigation"
        className="navbar max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 min-h-14 h-14 sm:h-16 justify-between gap-1 sm:gap-4"
      >
        {/* Brand & Mobile Hamburger: Uses w-auto and shrink-0 so it only takes needed width */}
        <div className="navbar-start w-auto flex-none gap-1 sm:gap-2">
          <div className="dropdown lg:hidden shrink-0">
            <label
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-square btn-xs sm:btn-sm text-base-content focus-visible:outline-2 focus-visible:outline-primary"
              aria-label="Open mobile menu"
            >
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </label>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-50 p-2 shadow-xl bg-base-100 rounded-2xl w-64 border border-base-300 gap-1"
            >
              {user && (
                <div className="px-3 py-2.5 mb-1 pb-2 border-b border-base-200">
                  <div className="text-xs text-base-content/50 uppercase font-bold tracking-wider">
                    Signed in as
                  </div>
                  <div className="font-bold text-sm text-base-content truncate">
                    {user.firstName} {user.lastName || ""}
                  </div>
                  <div className="text-xs font-mono text-base-content/60 truncate">
                    {user.email}
                  </div>
                </div>
              )}
              {renderNavLinks()}
              {user?.role === "admin" && (
                <li className="pt-1 mt-1 border-t border-base-200">
                  <NavLink
                    to="/admin"
                    className="flex items-center gap-2 text-primary font-semibold py-2"
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
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    <span>Admin Panel</span>
                  </NavLink>
                </li>
              )}
              {user && (
                <li className="pt-1 mt-1 border-t border-base-200">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-error hover:bg-error/10"
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
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Scaled brand mark and title */}
          <NavLink
            to="/"
            className="flex items-center gap-1 sm:gap-2 text-base-content tracking-tight hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-primary rounded-md shrink-0"
          >
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <BrandMark size="100%" />
            </div>
            <span className="text-md sm:text-base font-extrabold tracking-tight whitespace-nowrap">
              Neat<span className="font-medium opacity-85">Code</span>
            </span>
          </NavLink>
        </div>

        {/* Desktop Primary Navigation */}
        <div className="navbar-center hidden lg:flex">
          {user && (
            <ul className="menu menu-horizontal p-0 gap-1">
              {renderNavLinks()}
            </ul>
          )}
        </div>

        {/* User Actions: Uses w-auto and shrink-0 to prevent collision */}
        <div className="navbar-end w-auto flex-none gap-1 sm:gap-2">
          <div className="shrink-0 flex items-center scale-90 sm:scale-100 origin-right">
            <ThemeToggle />
          </div>

          {user ? (
            <div className="dropdown dropdown-end shrink-0">
              <button
                tabIndex={0}
                type="button"
                className="btn btn-ghost btn-xs sm:btn-sm h-8 sm:h-10 px-1 sm:px-3 flex items-center gap-1 sm:gap-2 rounded-xl border border-transparent hover:border-base-300 focus-visible:outline-2 focus-visible:outline-primary"
                aria-label="User profile and settings"
              >
                <div className="avatar placeholder">
                  <div className="bg-primary/10 text-primary w-6 h-6 sm:w-7 sm:h-7 rounded-lg font-bold text-xs flex items-center justify-center ring-1 ring-primary/30">
                    {user.firstName ? user.firstName[0].toUpperCase() : "U"}
                  </div>
                </div>
                <span className="text-sm font-semibold text-base-content max-w-[100px] truncate hidden sm:inline-block">
                  {user.firstName}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 text-base-content/50"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content mt-3 z-50 p-2 shadow-xl bg-base-100 rounded-2xl w-56 border border-base-300"
              >
                <li className="menu-title px-3 py-2 text-xs font-semibold text-base-content/50 border-b border-base-300 mb-1">
                  Signed in as{" "}
                  <span className="text-base-content font-bold truncate block">
                    {user.firstName} {user.lastName || ""}
                  </span>
                  <span className="text-[11px] font-mono font-normal text-base-content/60 truncate block">
                    {user.email}
                  </span>
                </li>

                {user.role === "admin" && (
                  <li>
                    <NavLink
                      to="/admin"
                      className="flex items-center gap-2 py-2 text-primary font-semibold"
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
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      <span>Admin Panel</span>
                    </NavLink>
                  </li>
                )}

                <li className="border-t border-base-200 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-error hover:bg-error/10 hover:text-error py-2.5 rounded-lg"
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
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Logout</span>
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <NavLink
                to="/login"
                className="btn btn-ghost btn-xs sm:btn-sm font-semibold px-2"
              >
                Sign In
              </NavLink>
              <NavLink
                to="/signup"
                className="btn btn-primary btn-xs sm:btn-sm font-semibold shadow-xs px-2 sm:px-3"
              >
                Get Started
              </NavLink>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

export default AppNav;
