import { useEffect, useRef, useState } from "react";
import { Link as RouterLink } from "react-router";
import toast from "react-hot-toast";

import axiosClient from "../utils/axiosClient";
import MarkdownContent from "../components/MarkdownContent";
import AppNav from "../components/AppNav";

function ConfirmationDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-2xl border border-base-300 bg-base-100 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-error/10 text-error">
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
                d="M12 9v3.75m-9.303 3.376L10.7 4.126a1.5 1.5 0 012.6 0l8.003 11.999A1.5 1.5 0 0120.003 18H3.997a1.5 1.5 0 01-1.3-2.25zM12 16.5h.008v.008H12V16.5z"
              />
            </svg>
          </div>

          <div className="flex-1">
            <h3
              id="confirmation-dialog-title"
              className="text-lg font-bold text-base-content"
            >
              {title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-base-content/60">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>

          <button type="button" className="btn btn-error" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function Workspace() {
  const [activeSection, setActiveSection] = useState("notes");

  const [notes, setNotes] = useState([]);
  const [links, setLinks] = useState([]);

  const [loading, setLoading] = useState(false);

  // Confirmation dialog state
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  // Note editor state
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteMode, setNoteMode] = useState("edit");
  const [savingNote, setSavingNote] = useState(false);

  // Link editor state
  const [showLinkEditor, setShowLinkEditor] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState(null);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [savingLink, setSavingLink] = useState(false);

  // Timer state
  const [timerDuration, setTimerDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);

  // Fetch workspace
  const fetchWorkspace = async () => {
    try {
      const response = await axiosClient.get("/workspace");

      setNotes(response.data.notes || []);
      setLinks(response.data.links || []);
    } catch (error) {
      console.error("Failed to fetch workspace:", error);

      toast.error(error.response?.data?.message || "Failed to load workspace");
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, []);

  // -------------------------
  // Notes
  // -------------------------

  const openCreateNote = () => {
    setEditingNoteId(null);
    setNoteTitle("");
    setNoteContent("");
    setNoteMode("edit");
    setShowNoteEditor(true);
  };

  const openEditNote = (note) => {
    setEditingNoteId(note._id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteMode("edit");
    setShowNoteEditor(true);
  };

  const closeNoteEditor = () => {
    setShowNoteEditor(false);
    setEditingNoteId(null);
    setNoteTitle("");
    setNoteContent("");
    setNoteMode("edit");
  };

  const saveNote = async (event) => {
    event.preventDefault();

    if (!noteTitle.trim()) {
      toast.error("Please enter a note title");
      return;
    }

    try {
      setSavingNote(true);

      if (editingNoteId) {
        const response = await axiosClient.patch(
          `/workspace/notes/${editingNoteId}`,
          {
            title: noteTitle,
            content: noteContent,
          },
        );

        setNotes((previousNotes) =>
          previousNotes.map((note) =>
            note._id === editingNoteId ? response.data.note : note,
          ),
        );

        toast.success("Note updated");
      } else {
        const response = await axiosClient.post("/workspace/notes", {
          title: noteTitle,
          content: noteContent,
        });

        setNotes((previousNotes) => [...previousNotes, response.data.note]);

        toast.success("Note created");
      }

      closeNoteEditor();
    } catch (error) {
      console.error("Failed to save note:", error);

      toast.error(error.response?.data?.message || "Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  const deleteNote = async (noteId) => {
    setConfirmation({
      isOpen: true,
      title: "Delete this note?",
      message:
        "This action cannot be undone. Are you sure you want to permanently delete this note?",
      onConfirm: async () => {
        setConfirmation({
          isOpen: false,
          title: "",
          message: "",
          onConfirm: null,
        });

        try {
          await axiosClient.delete(`/workspace/notes/${noteId}`);

          setNotes((previousNotes) =>
            previousNotes.filter((note) => note._id !== noteId),
          );

          if (editingNoteId === noteId) {
            closeNoteEditor();
          }

          toast.success("Note deleted");
        } catch (error) {
          console.error("Failed to delete note:", error);

          toast.error(error.response?.data?.message || "Failed to delete note");
        }
      },
    });
  };

  // -------------------------
  // Links
  // -------------------------

  const openCreateLink = () => {
    setEditingLinkId(null);
    setLinkTitle("");
    setLinkUrl("");
    setLinkDescription("");
    setShowLinkEditor(true);
  };

  const openEditLink = (link) => {
    setEditingLinkId(link._id);
    setLinkTitle(link.title);
    setLinkUrl(link.url);
    setLinkDescription(link.description || "");
    setShowLinkEditor(true);
  };

  const closeLinkEditor = () => {
    setShowLinkEditor(false);
    setEditingLinkId(null);
    setLinkTitle("");
    setLinkUrl("");
    setLinkDescription("");
  };

  const saveLink = async (event) => {
    event.preventDefault();

    if (!linkTitle.trim()) {
      toast.error("Please enter a link title");
      return;
    }

    if (!linkUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    try {
      setSavingLink(true);

      if (editingLinkId) {
        const response = await axiosClient.patch(
          `/workspace/links/${editingLinkId}`,
          {
            title: linkTitle,
            url: linkUrl,
            description: linkDescription,
          },
        );

        setLinks((previousLinks) =>
          previousLinks.map((link) =>
            link._id === editingLinkId ? response.data.link : link,
          ),
        );

        toast.success("Link updated");
      } else {
        const response = await axiosClient.post("/workspace/links", {
          title: linkTitle,
          url: linkUrl,
          description: linkDescription,
        });

        setLinks((previousLinks) => [...previousLinks, response.data.link]);

        toast.success("Link added");
      }

      closeLinkEditor();
    } catch (error) {
      console.error("Failed to save link:", error);

      toast.error(error.response?.data?.message || "Failed to save link");
    } finally {
      setSavingLink(false);
    }
  };

  const deleteLink = async (linkId) => {
    setConfirmation({
      isOpen: true,
      title: "Delete this link?",
      message:
        "This action cannot be undone. Are you sure you want to permanently delete this link?",
      onConfirm: async () => {
        setConfirmation({
          isOpen: false,
          title: "",
          message: "",
          onConfirm: null,
        });

        try {
          await axiosClient.delete(`/workspace/links/${linkId}`);

          setLinks((previousLinks) =>
            previousLinks.filter((link) => link._id !== linkId),
          );

          if (editingLinkId === linkId) {
            closeLinkEditor();
          }

          toast.success("Link deleted");
        } catch (error) {
          console.error("Failed to delete link:", error);

          toast.error(error.response?.data?.message || "Failed to delete link");
        }
      },
    });
  };

  // -------------------------
  // Timer
  // -------------------------

  useEffect(() => {
    if (!isTimerRunning) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((previousTime) => {
        if (previousTime <= 1) {
          clearInterval(timerRef.current);
          setIsTimerRunning(false);
          toast.success("Timer completed!");

          return 0;
        }

        return previousTime - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  };

  const startTimer = () => {
    if (timeLeft <= 0) {
      setTimeLeft(timerDuration);
    }

    setIsTimerRunning(true);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(timerDuration);
  };

  const selectTimerDuration = (durationInMinutes) => {
    const durationInSeconds = durationInMinutes * 60;

    setIsTimerRunning(false);
    setTimerDuration(durationInSeconds);
    setTimeLeft(durationInSeconds);
  };

  const timerPresets = [5, 15, 25, 45, 60];

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      <AppNav />

      <ConfirmationDialog
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        onConfirm={confirmation.onConfirm}
        onCancel={() =>
          setConfirmation({
            isOpen: false,
            title: "",
            message: "",
            onConfirm: null,
          })
        }
      />

      {/* Header */}
      <header className="border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-base-content/60 mb-2">
                <RouterLink to="/" className="hover:text-primary">
                  Home
                </RouterLink>
                <span>/</span>
                <span>Workspace</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Workspace
              </h1>

              <p className="mt-1 text-sm text-base-content/60">
                Your private notes, useful links, and productivity tools.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Section navigation */}
        <div className="tabs tabs-boxed bg-base-200 w-fit mb-8">
          <button
            type="button"
            className={`tab ${activeSection === "notes" ? "tab-active" : ""}`}
            onClick={() => setActiveSection("notes")}
          >
            Notes
          </button>

          <button
            type="button"
            className={`tab ${activeSection === "links" ? "tab-active" : ""}`}
            onClick={() => setActiveSection("links")}
          >
            Web Links
          </button>

          <button
            type="button"
            className={`tab ${activeSection === "timer" ? "tab-active" : ""}`}
            onClick={() => setActiveSection("timer")}
          >
            Timer
          </button>
        </div>

        {/* ---------------- NOTES SECTION ---------------- */}
        {activeSection === "notes" && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold">Markdown Notes</h2>
                <p className="text-sm text-base-content/60 mt-1">
                  Write and save your personal notes using Markdown.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={openCreateNote}
              >
                + New Note
              </button>
            </div>

            {/* Note editor */}
            {showNoteEditor && (
              <div className="card bg-base-200 border border-base-300 mb-8">
                <div className="card-body">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h3 className="card-title text-lg">
                      {editingNoteId ? "Edit Note" : "Create Note"}
                    </h3>

                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={closeNoteEditor}
                    >
                      Close
                    </button>
                  </div>

                  <form onSubmit={saveNote}>
                    <div className="form-control mb-4">
                      <label className="label">
                        <span className="label-text font-medium">
                          Note title
                        </span>
                      </label>

                      <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="e.g. React Performance"
                        value={noteTitle}
                        onChange={(event) => setNoteTitle(event.target.value)}
                      />
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Content</span>

                      <div className="join">
                        <button
                          type="button"
                          className={`btn btn-xs join-item ${
                            noteMode === "edit" ? "btn-primary" : ""
                          }`}
                          onClick={() => setNoteMode("edit")}
                        >
                          Editor
                        </button>

                        <button
                          type="button"
                          className={`btn btn-xs join-item ${
                            noteMode === "preview" ? "btn-primary" : ""
                          }`}
                          onClick={() => setNoteMode("preview")}
                        >
                          Preview
                        </button>
                      </div>
                    </div>

                    {noteMode === "edit" ? (
                      <textarea
                        className="textarea textarea-bordered w-full min-h-80 font-mono text-sm"
                        placeholder="# My Note&#10;&#10;Write your Markdown here..."
                        value={noteContent}
                        onChange={(event) => setNoteContent(event.target.value)}
                      />
                    ) : (
                      <div className="bg-base-100 border border-base-300 rounded-lg p-4 min-h-80 overflow-auto">
                        <MarkdownContent content={noteContent} />
                      </div>
                    )}

                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={closeNoteEditor}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className={`btn btn-primary ${
                          savingNote ? "btn-disabled" : ""
                        }`}
                        disabled={savingNote}
                      >
                        {savingNote ? (
                          <span className="loading loading-spinner loading-sm" />
                        ) : editingNoteId ? (
                          "Update Note"
                        ) : (
                          "Save Note"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Notes list */}
            {notes.length === 0 ? (
              <div className="border border-dashed border-base-300 rounded-2xl p-10 text-center">
                <h3 className="font-semibold text-lg">No notes yet</h3>
                <p className="text-sm text-base-content/60 mt-2">
                  Create your first Markdown note.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {notes.map((note) => (
                  <article
                    key={note._id}
                    className="card bg-base-100 border border-base-300 shadow-sm"
                  >
                    <div className="card-body">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="card-title text-lg">{note.title}</h3>

                          <p className="text-xs text-base-content/50 mt-1">
                            Updated{" "}
                            {note.updatedAt
                              ? new Date(note.updatedAt).toLocaleString()
                              : "recently"}
                          </p>
                        </div>

                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() => openEditNote(note)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-ghost text-error"
                            onClick={() => deleteNote(note._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 max-h-96 overflow-auto">
                        <MarkdownContent content={note.content} />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ---------------- LINKS SECTION ---------------- */}
        {activeSection === "links" && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold">Web Links</h2>
                <p className="text-sm text-base-content/60 mt-1">
                  Save useful documentation, resources, and websites.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={openCreateLink}
              >
                + Add Link
              </button>
            </div>

            {/* Link editor */}
            {showLinkEditor && (
              <div className="card bg-base-200 border border-base-300 mb-8">
                <div className="card-body">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h3 className="card-title text-lg">
                      {editingLinkId ? "Edit Link" : "Add Link"}
                    </h3>

                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={closeLinkEditor}
                    >
                      Close
                    </button>
                  </div>

                  <form onSubmit={saveLink}>
                    <div className="form-control mb-4">
                      <label className="label">
                        <span className="label-text font-medium">Title</span>
                      </label>

                      <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="e.g. React Documentation"
                        value={linkTitle}
                        onChange={(event) => setLinkTitle(event.target.value)}
                      />
                    </div>

                    <div className="form-control mb-4">
                      <label className="label">
                        <span className="label-text font-medium">
                          Website URL
                        </span>
                      </label>

                      <input
                        type="url"
                        className="input input-bordered w-full"
                        placeholder="https://example.com"
                        value={linkUrl}
                        onChange={(event) => setLinkUrl(event.target.value)}
                      />
                    </div>

                    <div className="form-control mb-4">
                      <label className="label">
                        <span className="label-text font-medium">
                          Description
                        </span>
                      </label>

                      <textarea
                        className="textarea textarea-bordered w-full"
                        placeholder="Optional description"
                        value={linkDescription}
                        onChange={(event) =>
                          setLinkDescription(event.target.value)
                        }
                      />
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={closeLinkEditor}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className={`btn btn-primary ${
                          savingLink ? "btn-disabled" : ""
                        }`}
                        disabled={savingLink}
                      >
                        {savingLink ? (
                          <span className="loading loading-spinner loading-sm" />
                        ) : editingLinkId ? (
                          "Update Link"
                        ) : (
                          "Save Link"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Links list */}
            {links.length === 0 ? (
              <div className="border border-dashed border-base-300 rounded-2xl p-10 text-center">
                <h3 className="font-semibold text-lg">No links yet</h3>
                <p className="text-sm text-base-content/60 mt-2">
                  Add your first useful website.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {links.map((link) => (
                  <article
                    key={link._id}
                    className="card bg-base-100 border border-base-300 shadow-sm"
                  >
                    <div className="card-body">
                      <h3 className="card-title text-lg">{link.title}</h3>

                      {link.description && (
                        <p className="text-sm text-base-content/70">
                          {link.description}
                        </p>
                      )}

                      <p className="text-xs text-base-content/50 break-all mt-2">
                        {link.url}
                      </p>

                      <div className="card-actions justify-end mt-4">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-primary"
                        >
                          Open
                        </a>

                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => openEditLink(link)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-ghost text-error"
                          onClick={() => deleteLink(link._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ---------------- TIMER SECTION ---------------- */}
        {activeSection === "timer" && (
          <section>
            <div className="mb-6">
              <h2 className="text-xl font-bold">Productivity Timer</h2>
              <p className="text-sm text-base-content/60 mt-1">
                A simple timer for focused study and work sessions.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="card bg-base-200 border border-base-300">
                <div className="card-body items-center text-center">
                  <p className="text-sm text-base-content/60">
                    {isTimerRunning ? "Timer running" : "Ready to focus"}
                  </p>

                  <div className="text-7xl sm:text-8xl font-mono font-bold tracking-tight my-6">
                    {formatTime(timeLeft)}
                  </div>

                  <div className="flex flex-wrap justify-center gap-3">
                    {!isTimerRunning ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={startTimer}
                      >
                        Start
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-warning"
                        onClick={pauseTimer}
                      >
                        Pause
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={resetTimer}
                    >
                      Reset
                    </button>
                  </div>

                  <div className="divider w-full">Presets</div>

                  <div className="flex flex-wrap justify-center gap-2">
                    {timerPresets.map((minutes) => (
                      <button
                        key={minutes}
                        type="button"
                        className={`btn btn-sm ${
                          timerDuration === minutes * 60
                            ? "btn-primary"
                            : "btn-outline"
                        }`}
                        onClick={() => selectTimerDuration(minutes)}
                      >
                        {minutes} min
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default Workspace;
