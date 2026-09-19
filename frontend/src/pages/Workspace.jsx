import { useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink } from "react-router";
import toast from "react-hot-toast";

import axiosClient from "../utils/axiosClient";
import MarkdownContent from "../components/MarkdownContent";
import AppNav from "../components/AppNav";
import { useTimer } from "../context/useTimer";
import { formatTimerDisplay } from "../utils/timerUtils";

function ConfirmationDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-xs">
      <div
        className="w-full max-w-md rounded-2xl border border-base-300 bg-base-100 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
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

            <p className="mt-2 text-sm leading-relaxed text-base-content/70">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-base-200">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>

          <button type="button" className="btn btn-error text-white" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Utility to get domain name from URL for favicons and badges
const getDomain = (url) => {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "link";
  }
};

export default function Workspace() {
  const [activeSection, setActiveSection] = useState("notes");

  const [notes, setNotes] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search queries
  const [noteSearch, setNoteSearch] = useState("");
  const [linkSearch, setLinkSearch] = useState("");

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
  const [noteMode, setNoteMode] = useState("edit"); // "edit" | "preview" | "split"
  const [savingNote, setSavingNote] = useState(false);
  const textareaRef = useRef(null);

  // Link editor state
  const [showLinkEditor, setShowLinkEditor] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState(null);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [savingLink, setSavingLink] = useState(false);

  // Timer from global context
  const {
    timeLeft,
    duration,
    isTimerRunning,
    isFloating,
    startTimer,
    pauseTimer,
    resetTimer,
    setPresetDuration,
    addFiveMinutes,
    toggleFloating,
    setIsFloating,
  } = useTimer();

  useEffect(() => {
    let isMounted = true;
    axiosClient
      .get("/workspace")
      .then((response) => {
        if (isMounted) {
          setNotes(response.data.notes || []);
          setLinks(response.data.links || []);
          setLoading(false);
        }
      })
      .catch((error) => {
        if (isMounted) {
          console.error("Failed to fetch workspace:", error);
          toast.error(error.response?.data?.message || "Failed to load workspace");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // -------------------------
  // Notes Functions
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

  const insertMarkdownSyntax = (prefix, suffix = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = noteContent.substring(start, end);
    const replacement = `${prefix}${selected || "text"}${suffix}`;

    const updated =
      noteContent.substring(0, start) + replacement + noteContent.substring(end);
    setNoteContent(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected.length || 4),
      );
    }, 0);
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

        toast.success("Note updated successfully");
      } else {
        const response = await axiosClient.post("/workspace/notes", {
          title: noteTitle,
          content: noteContent,
        });

        setNotes((previousNotes) => [response.data.note, ...previousNotes]);

        toast.success("Note created successfully");
      }

      closeNoteEditor();
    } catch (error) {
      console.error("Failed to save note:", error);
      toast.error(error.response?.data?.message || "Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  const deleteNote = async (noteId, noteTitle) => {
    setConfirmation({
      isOpen: true,
      title: "Delete this note?",
      message: `Are you sure you want to permanently delete "${noteTitle || "this note"}"? This action cannot be undone.`,
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

  const copyNoteContent = (content) => {
    navigator.clipboard.writeText(content);
    toast.success("Markdown copied to clipboard!");
  };

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    if (!noteSearch.trim()) return notes;
    const q = noteSearch.toLowerCase();
    return notes.filter(
      (n) =>
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.content && n.content.toLowerCase().includes(q)),
    );
  }, [notes, noteSearch]);

  // -------------------------
  // Links Functions
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

    // Auto-fix missing protocol
    let formattedUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      setSavingLink(true);

      if (editingLinkId) {
        const response = await axiosClient.patch(
          `/workspace/links/${editingLinkId}`,
          {
            title: linkTitle,
            url: formattedUrl,
            description: linkDescription,
          },
        );

        setLinks((previousLinks) =>
          previousLinks.map((link) =>
            link._id === editingLinkId ? response.data.link : link,
          ),
        );

        toast.success("Link updated successfully");
      } else {
        const response = await axiosClient.post("/workspace/links", {
          title: linkTitle,
          url: formattedUrl,
          description: linkDescription,
        });

        setLinks((previousLinks) => [response.data.link, ...previousLinks]);

        toast.success("Link added successfully");
      }

      closeLinkEditor();
    } catch (error) {
      console.error("Failed to save link:", error);
      toast.error(error.response?.data?.message || "Failed to save link");
    } finally {
      setSavingLink(false);
    }
  };

  const deleteLink = async (linkId, linkTitle) => {
    setConfirmation({
      isOpen: true,
      title: "Delete this bookmark?",
      message: `Are you sure you want to permanently delete "${linkTitle || "this bookmark"}"?`,
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

  const copyLinkUrl = (url) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard!");
  };

  // Filtered Links
  const filteredLinks = useMemo(() => {
    if (!linkSearch.trim()) return links;
    const q = linkSearch.toLowerCase();
    return links.filter(
      (l) =>
        (l.title && l.title.toLowerCase().includes(q)) ||
        (l.url && l.url.toLowerCase().includes(q)) ||
        (l.description && l.description.toLowerCase().includes(q)),
    );
  }, [links, linkSearch]);

  const timerPresets = [5, 15, 25, 45, 60];

  const timerProgress =
    duration > 0
      ? Math.min(100, Math.max(0, ((duration - timeLeft) / duration) * 100))
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex flex-col text-base-content">
        <AppNav />
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="loading loading-spinner loading-lg text-primary mb-3" />
          <p className="text-sm font-medium text-base-content/60">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 text-base-content flex flex-col">
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

      {/* Hero Header */}
      <header className="border-b border-base-300 bg-base-200/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-base-content/60 mb-2">
                <RouterLink
                  to="/"
                  className="hover:text-primary transition-colors"
                >
                  Home
                </RouterLink>
                <span>/</span>
                <span className="text-base-content font-semibold">
                  Workspace
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Personal Workspace
              </h1>
              <p className="mt-1 text-sm text-base-content/70 max-w-xl">
                Organize your study notes, save essential web resources, and
                maintain laser focus with the persistent multi-tab timer.
              </p>
            </div>

            {/* Quick Productivity Stats */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Notes Pill */}
              <div className="bg-base-100 border border-base-300 rounded-xl px-3.5 py-2 flex items-center gap-2.5 shadow-2xs">
                <div>
                  <div className="text-xs text-base-content/50 uppercase font-bold tracking-wider">
                    Notes
                  </div>
                  <div className="text-sm font-extrabold">{notes.length}</div>
                </div>
              </div>

              {/* Links Pill */}
              <div className="bg-base-100 border border-base-300 rounded-xl px-3.5 py-2 flex items-center gap-2.5 shadow-2xs">
                <div>
                  <div className="text-xs text-base-content/50 uppercase font-bold tracking-wider">
                    Bookmarks
                  </div>
                  <div className="text-sm font-extrabold">{links.length}</div>
                </div>
              </div>

              {/* Floating Timer Launcher Pill */}
              <div className="bg-base-100 border border-base-300 rounded-xl px-3.5 py-2 flex items-center gap-3 shadow-2xs">
                <div>
                  <div className="text-xs text-base-content/50 uppercase font-bold tracking-wider flex items-center gap-1">
                    <span>Timer</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isTimerRunning
                          ? "bg-primary animate-pulse"
                          : "bg-base-content/30"
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
                  className={`btn btn-xs rounded-lg gap-1 font-semibold ${
                    isFloating
                      ? "btn-outline btn-primary"
                      : "btn-primary shadow-xs"
                  }`}
                  title="Toggle movable floating timer"
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
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  <span>{isFloating ? "Hide Float" : "Float Timer"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-base-300 pb-4 mb-6 sm:mb-8">
          <div className="grid grid-cols-3 gap-1 p-1 bg-base-200 rounded-xl w-full">
            <button
              type="button"
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeSection === "notes"
                  ? "bg-base-100 text-primary shadow-xs"
                  : "text-base-content/65 hover:text-base-content hover:bg-base-100/50"
              }`}
              onClick={() => setActiveSection("notes")}
            >
              <span>Notes</span>
              <span className="badge badge-xs sm:badge-sm badge-ghost font-normal px-1.5">
                {notes.length}
              </span>
            </button>

            <button
              type="button"
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeSection === "links"
                  ? "bg-base-100 text-primary shadow-xs"
                  : "text-base-content/65 hover:text-base-content hover:bg-base-100/50"
              }`}
              onClick={() => setActiveSection("links")}
            >
              <span>Bookmarks</span>
              <span className="badge badge-xs sm:badge-sm badge-ghost font-normal px-1.5">
                {links.length}
              </span>
            </button>

            <button
              type="button"
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeSection === "timer"
                  ? "bg-base-100 text-primary shadow-xs"
                  : "text-base-content/65 hover:text-base-content hover:bg-base-100/50"
              }`}
              onClick={() => setActiveSection("timer")}
            >
              <span>Timer</span>
              {isTimerRunning && (
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
              )}
            </button>
          </div>
          {/* Quick Add Buttons on right */}
          <div className="hidden sm:flex items-center gap-2">
            {activeSection === "notes" && (
              <button
                type="button"
                className="btn btn-primary btn-sm gap-1.5 shadow-xs"
                onClick={openCreateNote}
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>New Note</span>
              </button>
            )}

            {activeSection === "links" && (
              <button
                type="button"
                className="btn btn-primary btn-sm gap-1.5 shadow-xs"
                onClick={openCreateLink}
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Add Bookmark</span>
              </button>
            )}
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* ----------------- NOTES SECTION -------------------- */}
        {/* ---------------------------------------------------- */}
        {activeSection === "notes" && (
          <section>
            {/* Search and Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                  placeholder="Search notes by title or content..."
                  className="input input-bordered w-full pl-10 text-sm focus:outline-2 focus:outline-primary"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/50 pointer-events-none"
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
                {noteSearch && (
                  <button
                    type="button"
                    onClick={() => setNoteSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-base-content/50 hover:text-base-content"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="btn btn-primary btn-sm sm:hidden gap-1.5 w-full justify-center"
                  onClick={openCreateNote}
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>New Note</span>
                </button>
              </div>
            </div>

            {/* Note Editor Modal / Card */}
            {showNoteEditor && (
              <div className="card bg-base-100 border border-primary/40 shadow-xl mb-8 overflow-hidden animate-in fade-in duration-200">
                <div className="px-6 py-4 bg-base-200/60 border-b border-base-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✍️</span>
                    <h3 className="font-bold text-lg text-base-content">
                      {editingNoteId ? "Edit Markdown Note" : "Create New Note"}
                    </h3>
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-ghost btn-circle"
                    onClick={closeNoteEditor}
                    title="Close editor"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="card-body p-6">
                  <form onSubmit={saveNote}>
                    <div className="form-control mb-4">
                      <label className="label pb-1.5">
                        <span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/70">
                          Note Title <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full text-base font-semibold"
                        placeholder="e.g., Dynamic Programming Patterns, React Concurrency"
                        value={noteTitle}
                        onChange={(event) => setNoteTitle(event.target.value)}
                        autoFocus
                      />
                    </div>

                    {/* Markdown Toolbar & Mode Switcher */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-base-200/70 rounded-xl mb-3 border border-base-300">
                      {/* Formatting Shortcuts */}
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          type="button"
                          onClick={() => insertMarkdownSyntax("**", "**")}
                          className="btn btn-xs btn-ghost font-bold"
                          title="Bold (**text**)"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdownSyntax("*", "*")}
                          className="btn btn-xs btn-ghost italic"
                          title="Italic (*text*)"
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdownSyntax("### ")}
                          className="btn btn-xs btn-ghost font-mono"
                          title="Heading (### )"
                        >
                          H3
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdownSyntax("```\n", "\n```")}
                          className="btn btn-xs btn-ghost font-mono"
                          title="Code block (```)"
                        >
                          &lt;/&gt;
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdownSyntax("`", "`")}
                          className="btn btn-xs btn-ghost font-mono"
                          title="Inline code (`code`)"
                        >
                          `code`
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdownSyntax("- ")}
                          className="btn btn-xs btn-ghost"
                          title="Bullet list (- )"
                        >
                          • List
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdownSyntax("- [ ] ")}
                          className="btn btn-xs btn-ghost"
                          title="Task checkbox (- [ ] )"
                        >
                          ☑ Task
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            insertMarkdownSyntax("[", "](https://)")
                          }
                          className="btn btn-xs btn-ghost"
                          title="Link [title](url)"
                        >
                          🔗 Link
                        </button>
                      </div>

                      {/* View Modes */}
                      <div className="join">
                        <button
                          type="button"
                          className={`btn btn-xs join-item ${
                            noteMode === "edit"
                              ? "btn-primary font-bold"
                              : "btn-ghost"
                          }`}
                          onClick={() => setNoteMode("edit")}
                        >
                          Write
                        </button>
                        <button
                          type="button"
                          className={`btn btn-xs join-item ${
                            noteMode === "split"
                              ? "btn-primary font-bold"
                              : "btn-ghost"
                          }`}
                          onClick={() => setNoteMode("split")}
                        >
                          Split
                        </button>
                        <button
                          type="button"
                          className={`btn btn-xs join-item ${
                            noteMode === "preview"
                              ? "btn-primary font-bold"
                              : "btn-ghost"
                          }`}
                          onClick={() => setNoteMode("preview")}
                        >
                          Preview
                        </button>
                      </div>
                    </div>

                    {/* Editor Content Area */}
                    {noteMode === "edit" && (
                      <textarea
                        ref={textareaRef}
                        className="textarea textarea-bordered w-full min-h-80 font-mono text-sm leading-relaxed"
                        placeholder="# Heading&#10;&#10;Write clean markdown notes here... Use headers, code blocks, bullet points, and math."
                        value={noteContent}
                        onChange={(event) => setNoteContent(event.target.value)}
                      />
                    )}

                    {noteMode === "preview" && (
                      <div className="bg-base-200/40 border border-base-300 rounded-xl p-5 min-h-80 max-h-[500px] overflow-y-auto prose dark:prose-invert max-w-none">
                        {noteContent.trim() ? (
                          <MarkdownContent content={noteContent} />
                        ) : (
                          <p className="text-base-content/40 italic">
                            Nothing to preview yet. Switch back to Write mode to
                            draft your note.
                          </p>
                        )}
                      </div>
                    )}

                    {noteMode === "split" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <textarea
                          ref={textareaRef}
                          className="textarea textarea-bordered w-full min-h-80 font-mono text-sm leading-relaxed"
                          placeholder="Write markdown here..."
                          value={noteContent}
                          onChange={(event) =>
                            setNoteContent(event.target.value)
                          }
                        />
                        <div className="bg-base-200/40 border border-base-300 rounded-xl p-5 min-h-80 max-h-[400px] overflow-y-auto prose dark:prose-invert max-w-none">
                          {noteContent.trim() ? (
                            <MarkdownContent content={noteContent} />
                          ) : (
                            <p className="text-base-content/40 italic">
                              Live preview will appear here...
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Footer Info & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t border-base-200">
                      <div className="text-xs text-base-content/50">
                        {noteContent.length} characters •{" "}
                        {noteContent.trim()
                          ? noteContent.trim().split(/\s+/).length
                          : 0}{" "}
                        words
                      </div>

                      <div className="flex justify-end gap-2.5">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={closeNoteEditor}
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          className="btn btn-primary btn-sm px-5 gap-2"
                          disabled={savingNote}
                        >
                          {savingNote ? (
                            <>
                              <span className="loading loading-spinner loading-xs" />
                              <span>Saving...</span>
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
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <span>
                                {editingNoteId ? "Update Note" : "Save Note"}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Notes Grid */}
            {filteredNotes.length === 0 ? (
              <div className="border border-dashed border-base-300 rounded-2xl p-12 text-center bg-base-100">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-3xl mx-auto mb-4">
                  📝
                </div>
                <h3 className="font-bold text-lg">
                  {noteSearch
                    ? "No matching notes found"
                    : "No notes saved yet"}
                </h3>
                <p className="text-sm text-base-content/60 mt-1 max-w-md mx-auto">
                  {noteSearch
                    ? `No notes match "${noteSearch}". Try another search term.`
                    : "Create your personal Markdown notes to record algorithms, notes from study sessions, and quick references."}
                </p>

                {noteSearch ? (
                  <button
                    type="button"
                    onClick={() => setNoteSearch("")}
                    className="btn btn-sm btn-ghost mt-4"
                  >
                    Clear Search
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm mt-4 gap-1.5"
                    onClick={openCreateNote}
                  >
                    + Create First Note
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {filteredNotes.map((note) => (
                  <article
                    key={note._id}
                    className="group card bg-base-100 border border-base-300 hover:border-primary/40 hover:shadow-md transition-all duration-200 rounded-2xl overflow-hidden flex flex-col"
                  >
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-base-200">
                        <div>
                          <h3 className="text-base font-bold text-base-content line-clamp-1 group-hover:text-primary transition-colors">
                            {note.title}
                          </h3>
                          <span className="text-[11px] text-base-content/50 mt-0.5 block">
                            Updated{" "}
                            {note.updatedAt
                              ? new Date(note.updatedAt).toLocaleDateString(
                                  undefined,
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )
                              : "Recently"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Copy Markdown button */}
                          <button
                            type="button"
                            onClick={() => copyNoteContent(note.content)}
                            className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-base-content"
                            title="Copy Markdown content"
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

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => openEditNote(note)}
                            className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-primary"
                            title="Edit note"
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => deleteNote(note._id, note.title)}
                            className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-error"
                            title="Delete note"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <div className="mt-3 text-sm max-h-60 overflow-y-auto pr-1">
                        <MarkdownContent content={note.content} />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ---------------------------------------------------- */}
        {/* ----------------- LINKS SECTION -------------------- */}
        {/* ---------------------------------------------------- */}
        {activeSection === "links" && (
          <section>
            {/* Search and Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={linkSearch}
                  onChange={(e) => setLinkSearch(e.target.value)}
                  placeholder="Search bookmarks by title, URL or description..."
                  className="input input-bordered w-full pl-10 text-sm focus:outline-2 focus:outline-primary"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/50 pointer-events-none"
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
                {linkSearch && (
                  <button
                    type="button"
                    onClick={() => setLinkSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-base-content/50 hover:text-base-content"
                  >
                    Clear
                  </button>
                )}
              </div>

              <button
                type="button"
                className="btn btn-primary btn-sm sm:hidden gap-1.5 w-full justify-center"
                onClick={openCreateLink}
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Add Bookmark</span>
              </button>
            </div>

            {/* Link Editor Card */}
            {showLinkEditor && (
              <div className="card bg-base-100 border border-primary/40 shadow-xl mb-8 overflow-hidden animate-in fade-in duration-200">
                <div className="px-6 py-4 bg-base-200/60 border-b border-base-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔗</span>
                    <h3 className="font-bold text-lg text-base-content">
                      {editingLinkId ? "Edit Bookmark" : "Add Web Bookmark"}
                    </h3>
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-ghost btn-circle"
                    onClick={closeLinkEditor}
                    title="Close editor"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="card-body p-6">
                  <form onSubmit={saveLink} className="space-y-4">
                    <div className="form-control">
                      <label className="label pb-1.5">
                        <span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/70">
                          Bookmark Title <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full text-sm font-semibold"
                        placeholder="e.g., React Docs, Visualgo Algorithm Visualizer"
                        value={linkTitle}
                        onChange={(event) => setLinkTitle(event.target.value)}
                        autoFocus
                      />
                    </div>

                    <div className="form-control">
                      <label className="label pb-1.5">
                        <span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/70">
                          Website URL <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          className="input input-bordered w-full pl-9 text-sm font-mono"
                          placeholder="https://react.dev"
                          value={linkUrl}
                          onChange={(event) => setLinkUrl(event.target.value)}
                        />
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label pb-1.5">
                        <span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/70">
                          Description (Optional)
                        </span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered w-full text-sm"
                        placeholder="Key points or summary of what this website provides..."
                        value={linkDescription}
                        onChange={(event) =>
                          setLinkDescription(event.target.value)
                        }
                        rows={2}
                      />
                    </div>

                    <div className="flex justify-end gap-2.5 pt-3 border-t border-base-200">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={closeLinkEditor}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="btn btn-primary btn-sm px-5"
                        disabled={savingLink}
                      >
                        {savingLink ? (
                          <>
                            <span className="loading loading-spinner loading-xs" />
                            <span>Saving...</span>
                          </>
                        ) : editingLinkId ? (
                          "Update Bookmark"
                        ) : (
                          "Save Bookmark"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Links Grid */}
            {filteredLinks.length === 0 ? (
              <div className="border border-dashed border-base-300 rounded-2xl p-12 text-center bg-base-100">
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center text-3xl mx-auto mb-4">
                  🔖
                </div>
                <h3 className="font-bold text-lg">
                  {linkSearch
                    ? "No matching bookmarks found"
                    : "No bookmarks saved yet"}
                </h3>
                <p className="text-sm text-base-content/60 mt-1 max-w-md mx-auto">
                  {linkSearch
                    ? `No links match "${linkSearch}". Try another search term.`
                    : "Save frequently referenced algorithm guides, documentation, and tools for instant one-click access."}
                </p>

                {linkSearch ? (
                  <button
                    type="button"
                    onClick={() => setLinkSearch("")}
                    className="btn btn-sm btn-ghost mt-4"
                  >
                    Clear Search
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm mt-4 gap-1.5"
                    onClick={openCreateLink}
                  >
                    + Add First Bookmark
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredLinks.map((link) => {
                  const domain = getDomain(link.url);
                  return (
                    <article
                      key={link._id}
                      className="group card bg-base-100 border border-base-300 hover:border-primary/40 hover:shadow-md transition-all duration-200 rounded-2xl overflow-hidden flex flex-col justify-between"
                    >
                      <div className="p-5">
                        {/* Hostname Badge & Favicon */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                              alt=""
                              className="w-5 h-5 rounded-md object-contain bg-base-200 p-0.5 shrink-0"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                            <span className="badge badge-sm badge-ghost font-mono text-[11px] text-base-content/70">
                              {domain}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => openEditLink(link)}
                              className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-primary"
                              title="Edit link"
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
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteLink(link._id, link.title)}
                              className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-error"
                              title="Delete link"
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <h3 className="font-bold text-base text-base-content line-clamp-1 group-hover:text-primary transition-colors">
                          {link.title}
                        </h3>

                        {link.description && (
                          <p className="text-xs text-base-content/70 mt-1.5 line-clamp-2 leading-relaxed">
                            {link.description}
                          </p>
                        )}

                        <p className="text-[11px] font-mono text-base-content/45 truncate mt-2">
                          {link.url}
                        </p>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-base-200/60 mt-2">
                        <button
                          type="button"
                          onClick={() => copyLinkUrl(link.url)}
                          className="btn btn-ghost btn-xs text-base-content/60 hover:text-base-content gap-1"
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
                          <span>Copy</span>
                        </button>

                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-xs gap-1 shadow-2xs"
                        >
                          <span>Visit</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ---------------------------------------------------- */}
        {/* ----------------- TIMER SECTION -------------------- */}
        {/* ---------------------------------------------------- */}
        {activeSection === "timer" && (
          <section className="max-w-3xl mx-auto">
            <div className="card bg-base-100 border border-base-300 shadow-xl rounded-3xl overflow-hidden mb-8">
              {/* Progress bar across top */}
              <div className="w-full bg-base-300 h-1.5">
                <div
                  className="bg-primary h-1.5 transition-all duration-300"
                  style={{ width: `${timerProgress}%` }}
                />
              </div>

              <div className="card-body items-center text-center p-6 sm:p-10">
                {/* Status indicator badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-base-200 border border-base-300 text-xs font-semibold mb-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isTimerRunning
                        ? "bg-primary animate-pulse"
                        : "bg-base-content/30"
                    }`}
                  />
                  <span>
                    {isTimerRunning
                      ? "Focus Session in Progress"
                      : timeLeft === 0
                        ? "Session Completed"
                        : "Ready to Focus"}
                  </span>
                </div>

                {/* Big Digital Clock */}
                <div className="text-6xl sm:text-8xl font-mono font-black tracking-tight text-base-content my-4 sm:my-6 select-none">
                  {formatTimerDisplay(timeLeft)}
                </div>

                {/* Primary Timer Controls */}
                <div className="flex flex-wrap justify-center items-center gap-3 mb-8">
                  <button
                    type="button"
                    className={`btn btn-lg px-8 gap-2 font-bold shadow-md ${
                      isTimerRunning ? "btn-warning" : "btn-primary"
                    }`}
                    onClick={isTimerRunning ? pauseTimer : startTimer}
                  >
                    {isTimerRunning ? (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Start Focusing</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-lg btn-outline gap-2"
                    onClick={resetTimer}
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
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>Reset</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-lg btn-ghost border border-base-300 font-semibold"
                    onClick={addFiveMinutes}
                    title="Add 5 minutes to timer"
                  >
                    +5 min
                  </button>
                </div>

                {/* Session Presets */}
                <div className="w-full pt-6 border-t border-base-200">
                  <div className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-3">
                    Choose Session Duration
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    {timerPresets.map((minutes) => {
                      const isSelected = duration === minutes * 60;
                      return (
                        <button
                          key={minutes}
                          type="button"
                          className={`btn btn-sm ${
                            isSelected
                              ? "btn-primary shadow-xs font-bold"
                              : "btn-outline border-base-300 text-base-content/70"
                          }`}
                          onClick={() => setPresetDuration(minutes)}
                        >
                          {minutes} min
                          {minutes === 25
                            ? " (Pomodoro)"
                            : minutes === 5
                              ? " (Quick)"
                              : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Floating Widget Toggle Banner */}
                <div className="mt-8 p-4 rounded-2xl bg-base-200/70 border border-base-300 w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-base-content">
                        Movable Floating Timer
                      </h4>
                      <p className="text-xs text-base-content/70 mt-0.5">
                        Pop out the timer to drag it anywhere across your
                        screen. It continues running even when you switch to
                        other browser tabs!
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsFloating(!isFloating)}
                    className={`btn btn-sm gap-2 shrink-0 ${
                      isFloating
                        ? "btn-outline btn-primary"
                        : "btn-primary shadow-xs"
                    }`}
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
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    <span>
                      {isFloating
                        ? "Hide Floating Widget"
                        : "Launch Floating Timer"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
