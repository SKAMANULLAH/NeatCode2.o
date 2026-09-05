const mongoose = require("mongoose");
const quizModel = require("../models/quizModel");
const topicModel = require("../models/topicModel");

const shuffleQuestions = (questions) => {
  const copy = [...questions];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const parseCount = (value) => {
  const count = parseInt(value, 10);
  if (!Number.isInteger(count) || count < 1) {
    return null;
  }
  return count;
};

const normalizeQuestions = async (questions, fallbackTopicId, fallbackSubtopicId) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return {
      error: { status: 400, message: "Add at least one question" },
    };
  }

  const topicCache = new Map();

  const loadTopic = async (id) => {
    const key = String(id || "");
    if (!key || !mongoose.Types.ObjectId.isValid(key)) {
      return null;
    }
    if (topicCache.has(key)) {
      return topicCache.get(key);
    }
    const topic = await topicModel.findById(key);
    topicCache.set(key, topic);
    return topic;
  };

  const normalized = [];

  for (const item of questions) {
    const topicId = item.topicId || fallbackTopicId;
    const subtopicId = item.subtopicId || fallbackSubtopicId;
    const topic = await loadTopic(topicId);

    if (!topic) {
      return {
        error: {
          status: 400,
          message: "Select a topic that already exists in the database",
        },
      };
    }

    const subtopic = (topic.subtopic || []).find(
      (entry) => String(entry._id) === String(subtopicId),
    );

    if (!subtopic) {
      return {
        error: {
          status: 400,
          message: `Select a subtopic that already exists under "${topic.title}"`,
        },
      };
    }

    normalized.push({
      statement: item.statement,
      option: item.option,
      correct: item.correct,
      topicId: topic._id,
      subtopicId: subtopic._id,
    });
  }

  return { questions: normalized };
};

const resolveTopicTitle = async (topicId) => {
  if (!topicId || !mongoose.Types.ObjectId.isValid(String(topicId))) {
    return null;
  }
  const topic = await topicModel.findById(topicId).select("title");
  return topic?.title || null;
};

// CREATE QUIZ
const createQuiz = async (req, res) => {
  try {
    const { topicId, subtopicId, question } = req.body;

    const topicTitle = await resolveTopicTitle(topicId);
    if (!topicTitle) {
      return res.status(400).json({
        message: "Select a topic that already exists in the database",
      });
    }

    const normalized = await normalizeQuestions(question, topicId, subtopicId);
    if (normalized.error) {
      return res.status(normalized.error.status).json({
        message: normalized.error.message,
      });
    }

    const existingQuiz = await quizModel.findOne({ title: topicTitle });

    if (existingQuiz) {
      return res.status(409).json({
        message:
          "A quiz for this topic already exists. Open it from the list and add more questions there.",
      });
    }

    const quiz = await quizModel.create({
      title: topicTitle,
      question: normalized.questions,
    });

    res.status(201).json({
      message: "Quiz created successfully",
      quiz,
    });
  } catch (err) {
    res.status(500).json({
      message: "Cannot create quiz",
      error: err.message,
    });
  }
};

// FETCH ALL QUIZ TITLES
const fetchQuizAll = async (req, res) => {
  try {
    const quizzes = await quizModel.find().select("title");

    if (quizzes.length === 0) {
      return res.status(404).json({
        message: "Sorry the quizzes are unavailable",
      });
    }

    return res.status(200).json(quizzes);
  } catch (err) {
    return res.status(500).json({
      message: "Cannot fetch quizzes",
      error: err.message,
    });
  }
};

// FETCH QUIZ BY TITLE
const fetchQuiz = async (req, res) => {
  try {
    const { title } = req.params;

    const quiz = await quizModel.findOne({ title });

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    const quizData = quiz.toObject();
    const allQuestions = Array.isArray(quizData.question) ? quizData.question : [];
    const count = parseCount(req.query.count);

    if (count) {
      quizData.question = shuffleQuestions(allQuestions).slice(
        0,
        Math.min(count, allQuestions.length),
      );
    }

    quizData.requestedCount = count || allQuestions.length;
    quizData.selectedCount = quizData.question.length;
    quizData.totalAvailable = allQuestions.length;

    res.status(200).json(quizData);
  } catch (err) {
    res.status(500).json({
      message: "Cannot fetch quiz",
      error: err.message,
    });
  }
};

// UPDATE QUIZ
const updateQuiz = async (req, res) => {
  try {
    const title = req.params.title || req.body.title;

    const { topicId, subtopicId, question } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Quiz title is required",
      });
    }

    const quiz = await quizModel.findOne({ title });

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    const topicTitle = await resolveTopicTitle(topicId);
    if (topicTitle) {
      quiz.title = topicTitle;
    }

    if (question) {
      const normalized = await normalizeQuestions(question, topicId, subtopicId);
      if (normalized.error) {
        return res.status(normalized.error.status).json({
          message: normalized.error.message,
        });
      }
      quiz.question = normalized.questions;
    }

    await quiz.save();

    res.status(200).json({
      message: "Quiz updated successfully",
      quiz,
    });
  } catch (err) {
    res.status(500).json({
      message: "Cannot update quiz",
      error: err.message,
    });
  }
};

const toObjectIds = (value) => {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list
    .flatMap((item) => String(item).split(","))
    .map((item) => item.trim())
    .filter((item) => mongoose.Types.ObjectId.isValid(item))
    .map((item) => new mongoose.Types.ObjectId(item));
};

const fetchRandom = async (req, res) => {
  try {
    const count = parseCount(req.query.count);

    if (!count) {
      return res.status(400).json({
        message: "A valid question count is required",
      });
    }

    const topicIds = toObjectIds(req.query.topicId).map((id) =>
      String(id),
    );
    const subtopicIds = toObjectIds(req.query.subtopicId).map((id) =>
      String(id),
    );

    const pipeline = [];

    if (req.query.title) {
      pipeline.push({
        $match: { title: req.query.title },
      });
    }

    pipeline.push({
      $unwind: "$question",
    });

    pipeline.push({
      $addFields: {
        subtopicIdStr: {
          $toString: { $ifNull: ["$question.subtopicId", ""] },
        },
        topicIdStr: {
          $toString: { $ifNull: ["$question.topicId", ""] },
        },
      },
    });

    if (subtopicIds.length > 0) {
      pipeline.push({
        $match: {
          subtopicIdStr: { $in: subtopicIds },
        },
      });
    } else if (topicIds.length > 0) {
      pipeline.push({
        $match: {
          topicIdStr: { $in: topicIds },
        },
      });
    }

    const matched = await quizModel.aggregate([
      ...pipeline,
      {
        $replaceRoot: { newRoot: "$question" },
      },
    ]);

    const totalAvailable = matched.length;

    if (totalAvailable === 0) {
      return res.status(404).json({
        message: "No quiz questions are available for the selected topics",
      });
    }

    const selected = shuffleQuestions(matched).slice(
      0,
      Math.min(count, totalAvailable),
    );

    return res.status(200).json({
      title: req.query.title || "Practice Quiz",
      question: selected,
      requestedCount: count,
      selectedCount: selected.length,
      totalAvailable,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Cannot fetch quiz",
      error: err.message,
    });
  }
};

module.exports = {
  createQuiz,
  fetchQuiz,
  fetchQuizAll,
  fetchRandom,
  updateQuiz,
};
