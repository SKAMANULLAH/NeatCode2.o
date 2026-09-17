import { Routes, Route, Navigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useRef } from "react";
import { Toaster } from "react-hot-toast";
import Homepage from "./pages/Homepage.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import AdminDelete from "./components/AdminDelete.jsx";
import Admin from "./pages/Admin.jsx";
import ProblemPage from "./pages/ProblemPage.jsx";
import AdminUpdate from "./components/AdminUpdate";
import AdminUpdateProblem from "./components/AdminUpdateProblem";
import Topics from "./pages/Topics.jsx";
import TopicDetail from "./pages/TopicDetail.jsx";
import Subtopic from "./pages/Subtopic.jsx";
import DsaSheet from "./pages/DsaSheet.jsx";
import QuizList from "./pages/QuizList.jsx";
import Quiz from "./pages/Quiz.jsx";
import AdminAddUser from "./pages/AdminAddUser.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminTopics from "./pages/AdminTopics.jsx";
import AdminQuizzes from "./pages/AdminQuizzes.jsx";
import Workspace from "./pages/Workspace.jsx";
import { checkAuth } from "./authSlice.js";
import { TimerProvider } from "./context/TimerContext.jsx";
import FloatingTimer from "./components/FloatingTimer.jsx";

function App() {
  // Do not fear I'm with u , we are just taking the global vars (of auth slice) except loading
  const { isAuthenticated, checkingAuth, user } = useSelector(
    (state) => state.auth,
  );
  // Sorry to say , if u want to use redux so u must use duspatcher . Okay!!!
  const dispatch = useDispatch();
  const [showReloadModal, setShowReloadModal] = useState(false);
  const handleBeforeUnloadRef = useRef(null);

  // Just saying to dispather that please run this fn of my auth slice .
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]); // Just passing stg that will never cause re run except for the firts time .

  // Ask confirmation before intentionally reloading or closing the website
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
      return "";
    };
    handleBeforeUnloadRef.current = handleBeforeUnload;

    const handleKeyDown = (e) => {
      // Intercept F5 or Ctrl+R / Cmd+R to show beautiful custom confirmation modal
      if (
        e.key === "F5" ||
        ((e.ctrlKey || e.metaKey) && (e.key === "r" || e.key === "R"))
      ) {
        e.preventDefault();
        setShowReloadModal(true);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleConfirmReload = () => {
    if (handleBeforeUnloadRef.current) {
      window.removeEventListener("beforeunload", handleBeforeUnloadRef.current);
    }
    setShowReloadModal(false);
    window.location.reload();
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <p className="text-sm font-medium tracking-tight text-base-content/60">
          Wait Bro...
        </p>
      </div>
    );
  }

  const requireAuth = (element) =>
    isAuthenticated ? element : <Navigate to="/login" />;

  const requireAdmin = (element) =>
    isAuthenticated && user?.role === "admin" ? element : <Navigate to="/" />;

  return (
    <TimerProvider>
      <FloatingTimer />
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <Homepage /> : <Landing />}
        />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" /> : <Login />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/" /> : <Signup />}
        />
        <Route path="/topics" element={requireAuth(<Topics />)} />
        <Route path="/topics/:topicId" element={requireAuth(<TopicDetail />)} />
        <Route
          path="/topics/:topicId/subtopics/:subtopicId"
          element={requireAuth(<Subtopic />)}
        />
        <Route path="/dsa" element={requireAuth(<DsaSheet />)} />
        <Route path="/quizzes" element={requireAuth(<QuizList />)} />
        <Route path="/quizzes/start" element={requireAuth(<Quiz />)} />
        <Route path="/quiz/:title" element={requireAuth(<Quiz />)} />
        <Route path="/admin" element={requireAdmin(<Admin />)} />
        <Route path="/admin/create" element={requireAdmin(<AdminPanel />)} />
        <Route path="/admin/delete" element={requireAdmin(<AdminDelete />)} />
        <Route
          path="/admin/update/:problemId"
          element={requireAdmin(<AdminUpdateProblem />)}
        />
        <Route path="/admin/update" element={requireAdmin(<AdminUpdate />)} />
        <Route path="/admin/users" element={requireAdmin(<AdminUsers />)} />
        <Route path="/admin/user" element={requireAdmin(<AdminAddUser />)} />
        <Route path="/admin/topics" element={requireAdmin(<AdminTopics />)} />
        <Route path="/admin/quizzes" element={requireAdmin(<AdminQuizzes />)} />
        <Route path="/workspace" element={requireAuth(<Workspace />)} />
        <Route
          path="/problem/:problemId"
          element={requireAuth(<ProblemPage />)}
        />
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
        }}
      />

      {/* Beautiful Reload Confirmation Modal */}
      {showReloadModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-base-300 bg-base-100 p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 ring-1 ring-primary/20">
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold tracking-tight text-base-content">
                  Confirm Page Reload
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-base-content/70 leading-relaxed">
                  Are you sure you want to reload this page? Any unsaved changes in your code editor, workspace notes, or active problem state may be lost.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-base-200">
              <button
                type="button"
                onClick={() => setShowReloadModal(false)}
                className="btn btn-ghost btn-sm h-9 px-4 rounded-xl font-semibold text-base-content/70 hover:text-base-content"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReload}
                className="btn btn-primary btn-sm h-9 px-4 rounded-xl font-semibold gap-1.5 shadow-sm"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </TimerProvider>
  );
}

export default App;
