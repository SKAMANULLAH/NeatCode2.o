import { Routes, Route, Navigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
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
import AdminTopics from "./pages/AdminTopics.jsx";
import AdminQuizzes from "./pages/AdminQuizzes.jsx";
import Workspace from "./pages/Workspace.jsx";
import { checkAuth } from "./authSlice.js";

function App() {
  // Do not fear I'm with u , we are just taking the global vars (of auth slice) except loading
  const { isAuthenticated, checkingAuth, user } = useSelector(
    (state) => state.auth,
  );
  // Sorry to say , if u want to use redux so u must use duspatcher . Okay!!!
  const dispatch = useDispatch();
  // Just saying to dispather that please run this fn of my auth slice .
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]); // Just passing stg that will never cause re run except for the firts time .
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
    <>
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
    </>
  );
}

export default App;
