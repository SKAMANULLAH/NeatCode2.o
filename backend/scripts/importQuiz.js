require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
});

const fs = require("fs/promises");
const path = require("path");
const mongoose = require("mongoose");
const topicModel = require("../src/models/topicModel");
const quizModel = require("../src/models/quizModel");
const connectDb = require("../src/config/db");

const CORRECT_KEYS = ["a", "b", "c", "d"];

const usage = () => {
  console.error("Usage: node scripts/importQuiz.js <path-to-json>");
  console.error("Example: node scripts/importQuiz.js quiz.example.json");
};

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const resolveFilePath = async (fileArg) => {
  const fromCwd = path.resolve(process.cwd(), fileArg);
  try {
    await fs.access(fromCwd);
    return fromCwd;
  } catch {
    const fromScriptDir = path.resolve(__dirname, fileArg);
    await fs.access(fromScriptDir);
    return fromScriptDir;
  }
};

const parseOptions = (rawOptions, index) => {
  if (!Array.isArray(rawOptions) || rawOptions.length !== 4) {
    throw new Error(`questions[${index}] must have exactly 4 options`);
  }

  return rawOptions.map((item, optionIndex) => {
    if (typeof item === "string") {
      if (!isNonEmptyString(item)) {
        throw new Error(
          `questions[${index}].options[${optionIndex}] must be a non-empty string`,
        );
      }
      return { choice: item.trim() };
    }

    if (item && typeof item === "object" && isNonEmptyString(item.choice)) {
      return { choice: item.choice.trim() };
    }

    throw new Error(
      `questions[${index}].options[${optionIndex}] must be a string or { "choice": "..." }`,
    );
  });
};

const parseQuizPayload = (raw) => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("JSON root must be an object");
  }

  const topicTitle = raw.topicTitle ?? raw.topic;
  if (!isNonEmptyString(topicTitle)) {
    throw new Error("topicTitle must be a non-empty string");
  }

  const defaultSubtopicTitle = raw.subtopicTitle ?? raw.subtopic ?? "";
  const questionsSource = raw.questions ?? raw.question;

  if (!Array.isArray(questionsSource) || questionsSource.length === 0) {
    throw new Error("questions must be a non-empty array");
  }

  const questions = questionsSource.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`questions[${index}] must be an object`);
    }

    if (!isNonEmptyString(item.statement)) {
      throw new Error(`questions[${index}].statement must be a non-empty string`);
    }

    const subtopicTitle = item.subtopicTitle ?? item.subtopic ?? defaultSubtopicTitle;
    if (!isNonEmptyString(subtopicTitle)) {
      throw new Error(
        `questions[${index}] needs subtopicTitle, or set subtopicTitle once at the root`,
      );
    }

    const correct = String(item.correct || "").trim().toLowerCase();
    if (!CORRECT_KEYS.includes(correct)) {
      throw new Error(`questions[${index}].correct must be one of a, b, c, d`);
    }

    return {
      statement: item.statement.trim(),
      option: parseOptions(item.options ?? item.option, index),
      correct,
      subtopicTitle: subtopicTitle.trim(),
    };
  });

  return {
    topicTitle: topicTitle.trim(),
    questions,
  };
};

const findSubtopic = (topic, subtopicTitle) => {
  const wanted = subtopicTitle.trim().toLowerCase();
  return (topic.subtopic || []).find(
    (item) => String(item.title || "").trim().toLowerCase() === wanted,
  );
};

const main = async () => {
  const fileArg = process.argv[2];

  if (!fileArg) {
    usage();
    process.exit(1);
  }

  if (!process.env.DB_STRING) {
    throw new Error("DB_STRING is missing in backend/.env");
  }

  const filePath = await resolveFilePath(fileArg);
  const payload = parseQuizPayload(JSON.parse(await fs.readFile(filePath, "utf8")));

  await connectDb();

  const topic = await topicModel.findOne({ title: payload.topicTitle });
  if (!topic) {
    throw new Error(
      `Topic "${payload.topicTitle}" does not exist. Import or create that topic first.`,
    );
  }

  const existingQuiz = await quizModel.findOne({ title: topic.title });
  if (existingQuiz) {
    throw new Error(
      `A quiz for topic "${topic.title}" already exists. Delete it first or add questions in Admin.`,
    );
  }

  const question = payload.questions.map((item, index) => {
    const subtopic = findSubtopic(topic, item.subtopicTitle);
    if (!subtopic) {
      throw new Error(
        `questions[${index}] subtopic "${item.subtopicTitle}" was not found under topic "${topic.title}"`,
      );
    }

    return {
      statement: item.statement,
      option: item.option,
      correct: item.correct,
      topicId: topic._id,
      subtopicId: subtopic._id,
    };
  });

  const quiz = await quizModel.create({
    title: topic.title,
    question,
  });

  console.log(`Created quiz "${quiz.title}" with ${quiz.question.length} question(s)`);
  console.log(`Quiz id: ${quiz._id}`);
  console.log(`Topic id: ${topic._id}`);
};

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
