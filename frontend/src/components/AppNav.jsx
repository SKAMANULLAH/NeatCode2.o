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
    `px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
      isActive
        ? "bg-primary/10 text-primary font-semibold"
        : "text-base-content/65 hover:text-base-content hover:bg-base-200/80"
    }`;

  const renderNavLinks = () => (
    <>
      <li>
        <NavLink to="/" end className={navLinkClass}>
          Home
        </NavLink>
      </li>
      <li>
        <NavLink to="/topics" className={navLinkClass}>
          Topics
        </NavLink>
      </li>
      <li>
        <NavLink to="/dsa" className={navLinkClass}>
          DSA
        </NavLink>
      </li>
      <li>
        <NavLink to="/quizzes" className={navLinkClass}>
          Practice Quiz
        </NavLink>
      </li>
      {user?.role === "admin" && (
        <li>
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-base-content/65 hover:text-base-content hover:bg-base-200/80"
              }`
            }
          >
            Admin
            <span className="badge badge-xs badge-primary font-bold uppercase tracking-wider">
              Admin
            </span>
          </NavLink>
        </li>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-base-300 bg-base-100/85 backdrop-blur-xl transition-colors">
      <nav
        aria-label="Main Navigation"
        className="navbar max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 h-16"
      >
        {/* Brand & Mobile Hamburger */}
        <div className="navbar-start gap-2">
          {user && (
            <div className="dropdown md:hidden">
              <label
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-square btn-sm text-base-content focus-visible:outline-2 focus-visible:outline-primary"
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
                className="menu menu-sm dropdown-content mt-3 z-50 p-2 shadow-lg bg-base-100 rounded-box w-56 border border-base-300 gap-1"
              >
                {renderNavLinks()}
              </ul>
            </div>
          )}

          <NavLink
            to="/"
            className="flex items-center gap-2.5 text-base-content text-lg sm:text-xl tracking-tight hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-primary rounded-md px-1"
          >
            <BrandMark size={32} />
            <span>
              <span className="font-semibold tracking-tight">Neat</span>
              <span className="font-medium opacity-80">Code</span>
            </span>
          </NavLink>
        </div>

        {/* Desktop Primary Navigation */}
        {user && (
          <div className="navbar-center hidden md:flex">
            <ul className="menu menu-horizontal p-0 gap-1">
              {renderNavLinks()}
            </ul>
          </div>
        )}

        {/* User Actions / Dropdown */}
        <div className="navbar-end gap-2 sm:gap-3">
          <ThemeToggle />
          {user && (
            <div className="dropdown dropdown-end">
              <button
                tabIndex={0}
                type="button"
                className="btn btn-ghost btn-sm h-10 px-2 sm:px-3 flex items-center gap-2 rounded-lg border border-transparent hover:border-base-300 focus-visible:outline-2 focus-visible:outline-primary"
                aria-label="User profile and settings"
              >
                <div className="avatar placeholder">
                  <div className="bg-primary/10 text-primary w-7 h-7 rounded-md font-semibold text-xs flex items-center justify-center ring-1 ring-primary/30">
                    {user.firstName ? user.firstName[0].toUpperCase() : "U"}
                  </div>
                </div>
                <span className="text-sm font-medium text-base-content max-w-[100px] truncate hidden sm:inline-block">
                  {user.firstName}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-base-content/50"
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
                className="menu menu-sm dropdown-content mt-3 z-50 p-2 shadow-xl bg-base-100 rounded-box w-52 border border-base-300"
              >
                <li className="menu-title px-3 py-2 text-xs font-semibold text-base-content/50 border-b border-base-300 mb-1">
                  Signed in as{" "}
                  <span className="text-base-content font-bold truncate block">
                    {user.firstName}
                  </span>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-error hover:bg-error/10 hover:text-error active:bg-error/20 py-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-error"
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
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

export default AppNav;
