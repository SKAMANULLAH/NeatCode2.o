const express = require("express");

const {
  getWorkspace,
  createNote,
  updateNote,
  deleteNote,
  createLink,
  updateLink,
  deleteLink,
} = require("../controllers/workspaceController.js");

const userMiddleware = require("../middleware/userMiddleware.js");

const workspaceRouter = express.Router();

// Fetch workspace
workspaceRouter.get("/", userMiddleware, getWorkspace);

// Notes
workspaceRouter.post("/notes", userMiddleware, createNote);
workspaceRouter.patch("/notes/:noteId", userMiddleware, updateNote);
workspaceRouter.delete("/notes/:noteId", userMiddleware, deleteNote);

// Links
workspaceRouter.post("/links", userMiddleware, createLink);
workspaceRouter.patch("/links/:linkId", userMiddleware, updateLink);
workspaceRouter.delete("/links/:linkId", userMiddleware, deleteLink);

module.exports = workspaceRouter;
