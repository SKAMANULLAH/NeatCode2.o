const workspaceModel = require("../models/workspaceModel");

// Get the single workspace.
// If it does not exist, create it.
const getOrCreateWorkspace = async (userId) => {
  let workspace = await workspaceModel.findOne({
    owner: userId,
  });

  if (!workspace) {
    workspace = await workspaceModel.create({
      owner: userId,
      notes: [],
      links: [],
    });
  }

  return workspace;
};

// GET /api/workspace
const getWorkspace = async (req, res) => {
  try {
    const workspace = await getOrCreateWorkspace(req.result._id);

    return res.status(200).json(workspace);
  } catch (err) {
    return res.status(500).json({
      message: "Cannot fetch workspace",
      error: err.message,
    });
  }
};

// POST /api/workspace/notes
const createNote = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        message: "Note title is required",
      });
    }

    if (typeof content !== "string") {
      return res.status(400).json({
        message: "Note content is required",
      });
    }

    const workspace = await getOrCreateWorkspace(req.result._id);

    workspace.notes.push({
      title: title.trim(),
      content,
    });

    await workspace.save();

    const createdNote = workspace.notes[workspace.notes.length - 1];

    return res.status(201).json({
      message: "Note created successfully",
      note: createdNote,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Cannot create note",
      error: err.message,
    });
  }
};

// PATCH /api/workspace/notes/:noteId
const updateNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { title, content } = req.body;

    const workspace = await getOrCreateWorkspace(req.result._id);

    const note = workspace.notes.id(noteId);

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          message: "Note title cannot be empty",
        });
      }

      note.title = title.trim();
    }

    if (content !== undefined) {
      note.content = content;
    }

    await workspace.save();

    return res.status(200).json({
      message: "Note updated successfully",
      note,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Cannot update note",
      error: err.message,
    });
  }
};

// DELETE /api/workspace/notes/:noteId
const deleteNote = async (req, res) => {
  try {
    const { noteId } = req.params;

    const workspace = await getOrCreateWorkspace(req.result._id);

    const note = workspace.notes.id(noteId);

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    workspace.notes.pull(noteId);

    await workspace.save();

    return res.status(200).json({
      message: "Note deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Cannot delete note",
      error: err.message,
    });
  }
};

// POST /api/workspace/links
const createLink = async (req, res) => {
  try {
    const { title, url, description } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        message: "Link title is required",
      });
    }

    if (!url?.trim()) {
      return res.status(400).json({
        message: "URL is required",
      });
    }

    try {
      new URL(url.trim());
    } catch {
      return res.status(400).json({
        message: "Please provide a valid URL",
      });
    }

    const workspace = await getOrCreateWorkspace(req.result._id);

    workspace.links.push({
      title: title.trim(),
      url: url.trim(),
      description: description?.trim() || "",
    });

    await workspace.save();

    const createdLink = workspace.links[workspace.links.length - 1];

    return res.status(201).json({
      message: "Link created successfully",
      link: createdLink,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Cannot create link",
      error: err.message,
    });
  }
};

// PATCH /api/workspace/links/:linkId
const updateLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { title, url, description } = req.body;

    const workspace = await getOrCreateWorkspace(req.result._id);

    const link = workspace.links.id(linkId);

    if (!link) {
      return res.status(404).json({
        message: "Link not found",
      });
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          message: "Link title cannot be empty",
        });
      }

      link.title = title.trim();
    }

    if (url !== undefined) {
      if (!url.trim()) {
        return res.status(400).json({
          message: "URL cannot be empty",
        });
      }

      try {
        new URL(url.trim());
      } catch {
        return res.status(400).json({
          message: "Please provide a valid URL",
        });
      }

      link.url = url.trim();
    }

    if (description !== undefined) {
      link.description = description.trim();
    }

    await workspace.save();

    return res.status(200).json({
      message: "Link updated successfully",
      link,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Cannot update link",
      error: err.message,
    });
  }
};

// DELETE /api/workspace/links/:linkId
const deleteLink = async (req, res) => {
  try {
    const { linkId } = req.params;

    const workspace = await getOrCreateWorkspace(req.result._id);

    const link = workspace.links.id(linkId);

    if (!link) {
      return res.status(404).json({
        message: "Link not found",
      });
    }

    workspace.links.pull(linkId);

    await workspace.save();

    return res.status(200).json({
      message: "Link deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Cannot delete link",
      error: err.message,
    });
  }
};

module.exports = {
  getWorkspace,
  createNote,
  updateNote,
  deleteNote,
  createLink,
  updateLink,
  deleteLink,
};
