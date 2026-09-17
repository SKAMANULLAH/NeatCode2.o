import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

import axiosClient from "../utils/axiosClient";
import AppNav from "../components/AppNav";

export default function AdminUsers() {
  const { user: currentUser } = useSelector((state) => state.auth);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deletingId, setDeletingId] = useState(null);

  // User deletion confirmation modal state
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get("/user/all");
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error(
        err.response?.data?.message || err.message || "Failed to load users",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    axiosClient
      .get("/user/all")
      .then((response) => {
        if (isMounted) {
          setUsers(Array.isArray(response.data) ? response.data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to fetch users:", err);
          toast.error(
            err.response?.data?.message || err.message || "Failed to load users",
          );
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setDeletingId(userToDelete._id);
      await axiosClient.delete(`/user/remove/${userToDelete._id}`);

      toast.success(
        `User ${userToDelete.firstName} ${userToDelete.lastName || ""} deleted successfully`,
      );

      // Remove from list
      setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));
      setUserToDelete(null);
    } catch (err) {
      console.error("Failed to delete user:", err);
      toast.error(
        err.response?.data?.message || err.message || "Failed to delete user",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = (text, label = "Email") => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
    const email = (u.email || "").toLowerCase();
    const query = searchQuery.trim().toLowerCase();

    const matchesSearch =
      !query || fullName.includes(query) || email.includes(query);

    const matchesRole =
      roleFilter === "all" ? true : u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const standardUserCount = users.filter((u) => u.role !== "admin").length;

  return (
    <div className="min-h-screen bg-base-100 flex flex-col text-base-content">
      <AppNav />

      {/* Confirmation Dialog */}
      {userToDelete && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-xs">
          <div
            className="w-full max-w-md rounded-2xl border border-base-300 bg-base-100 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-user-title"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-error/15 text-error">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>

              <div className="flex-1">
                <h3
                  id="delete-user-title"
                  className="text-lg font-bold text-base-content"
                >
                  Delete User Account?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                  Are you sure you want to permanently delete{" "}
                  <span className="font-semibold text-base-content">
                    {userToDelete.firstName} {userToDelete.lastName || ""}
                  </span>{" "}
                  (
                  <span className="font-mono text-xs text-primary">
                    {userToDelete.email}
                  </span>
                  )? This action cannot be undone and will erase their account from
                  the database.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-base-200">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setUserToDelete(null)}
                disabled={deletingId !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-error gap-2 text-white"
                onClick={confirmDeleteUser}
                disabled={deletingId !== null}
              >
                {deletingId ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    <span>Deleting...</span>
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    <span>Delete User</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
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
            <li className="text-base-content font-semibold">Manage Users</li>
          </ul>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              User Directory & Accounts
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              All Users in Database
            </h1>
            <p className="mt-1 text-sm text-base-content/70">
              Browse all registered users with their name and email, and manage
              user accounts.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fetchUsers}
              className="btn btn-outline btn-sm gap-1.5"
              title="Refresh users list"
              disabled={loading}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
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
              <span>Refresh</span>
            </button>

            <NavLink to="/admin/user" className="btn btn-primary btn-sm gap-1.5">
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
            </NavLink>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-base-100 border border-base-300 rounded-xl p-4 flex items-center gap-4 shadow-2xs">
           
            <div>
              <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                Total Users
              </p>
              <p className="text-2xl font-bold tracking-tight mt-0.5">
                {totalUsers}
              </p>
            </div>
          </div>

          <div className="bg-base-100 border border-base-300 rounded-xl p-4 flex items-center gap-4 shadow-2xs">
           
            <div>
              <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                Administrators
              </p>
              <p className="text-2xl font-bold tracking-tight mt-0.5">
                {adminCount}
              </p>
            </div>
          </div>

          <div className="bg-base-100 border border-base-300 rounded-xl p-4 flex items-center gap-4 shadow-2xs">
            
            <div>
              <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                Students / Users
              </p>
              <p className="text-2xl font-bold tracking-tight mt-0.5">
                {standardUserCount}
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="input input-bordered w-full pl-10 text-sm focus:outline-2 focus:outline-primary"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content text-xs font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Role Filter Pills */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <span className="text-xs font-semibold text-base-content/60 mr-1 hidden md:inline">
              Filter:
            </span>
            <button
              type="button"
              onClick={() => setRoleFilter("all")}
              className={`btn btn-xs rounded-lg ${
                roleFilter === "all" ? "btn-primary" : "btn-ghost border-base-300"
              }`}
            >
              All ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("admin")}
              className={`btn btn-xs rounded-lg ${
                roleFilter === "admin" ? "btn-primary" : "btn-ghost border-base-300"
              }`}
            >
              Admins ({adminCount})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("user")}
              className={`btn btn-xs rounded-lg ${
                roleFilter === "user" ? "btn-primary" : "btn-ghost border-base-300"
              }`}
            >
              Users ({standardUserCount})
            </button>
          </div>
        </div>

        {/* Users Table / List */}
        {loading ? (
          <div className="bg-base-100 border border-base-300 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
            <span className="loading loading-spinner loading-lg text-primary mb-3" />
            <p className="text-sm font-medium text-base-content/70">
              Loading users directory from database...
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-base-100 border border-base-300 border-dashed rounded-2xl p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-base-200 flex items-center justify-center text-2xl mb-3">
              🔍
            </div>
            <h3 className="font-bold text-lg">No users found</h3>
            <p className="text-sm text-base-content/60 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No users matching "${searchQuery}". Try a different search term.`
                : "No users currently registered in the database."}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="btn btn-sm btn-ghost mt-4"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="bg-base-100 border border-base-300 rounded-2xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-left">
                <thead>
                  <tr className="bg-base-200/70 border-b border-base-300 text-xs font-semibold text-base-content/70 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">User</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Joined Date</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200">
                  {filteredUsers.map((item) => {
                    const isSelf =
                      currentUser &&
                      (currentUser._id === item._id ||
                        currentUser.email === item.email);
                    const fullName = `${item.firstName || ""} ${
                      item.lastName || ""
                    }`.trim() || "Unnamed User";
                    const initial = item.firstName
                      ? item.firstName[0].toUpperCase()
                      : "U";

                    return (
                      <tr
                        key={item._id}
                        className="hover:bg-base-200/50 transition-colors"
                      >
                        {/* Name & Avatar */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="avatar placeholder shrink-0">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold text-sm ring-1 ring-primary/20 flex items-center justify-center">
                                {initial}
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold text-base-content flex items-center gap-2">
                                <span>{fullName}</span>
                                {isSelf && (
                                  <span className="badge badge-xs badge-info font-medium">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-base-content/50 block sm:hidden">
                                {item.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs sm:text-sm text-base-content/85">
                              {item.email}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(item.email, "Email")
                              }
                              className="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-base-content"
                              title="Copy email address"
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
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-4 px-4">
                          <span
                            className={`badge badge-sm font-semibold capitalize ${
                              item.role === "admin"
                                ? "badge-primary/20 text-primary border-primary/30"
                                : "badge-ghost border-base-300 text-base-content/70"
                            }`}
                          >
                            {item.role || "user"}
                          </span>
                        </td>

                        {/* Joined Date */}
                        <td className="py-4 px-4 text-xs text-base-content/60">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )
                            : "—"}
                        </td>

                        {/* Delete Action Button */}
                        <td className="py-4 px-4 sm:px-6 text-right">
                          {isSelf ? (
                            <span
                              className="text-xs text-base-content/40 italic"
                              title="You cannot delete your own active admin account"
                            >
                              Active Admin
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setUserToDelete({
                                  _id: item._id,
                                  firstName: item.firstName,
                                  lastName: item.lastName,
                                  email: item.email,
                                })
                              }
                              className="btn btn-ghost btn-sm text-error hover:bg-error/15 gap-1.5"
                              title={`Delete ${fullName}`}
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              <span>Delete</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer / Summary */}
            <div className="px-6 py-3 bg-base-200/40 border-t border-base-300 text-xs text-base-content/60 flex items-center justify-between">
              <span>
                Showing {filteredUsers.length} of {users.length} registered user{users.length === 1 ? "" : "s"}
              </span>
              <span>NeatCode Admin Services</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
