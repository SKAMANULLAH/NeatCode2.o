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
  console.error("Usage:");
  console.error("  node scripts/importQuiz.js <path-to-json>");
  console.error("");
  console.error("Example:");
  console.error("  node scripts/importQuiz.js quiz.json");
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
    // Format:
    // "Some option"
    if (typeof item === "string") {
      if (!isNonEmptyString(item)) {
        throw new Error(
          `questions[${index}].options[${optionIndex}] must be a non-empty string`,
        );
      }

      return {
        choice: item.trim(),
      };
    }

    // Also support:
    // { "choice": "Some option" }
    if (item && typeof item === "object" && isNonEmptyString(item.choice)) {
      return {
        choice: item.choice.trim(),
      };
    }

    throw new Error(
      `questions[${index}].options[${optionIndex}] must be a string or { "choice": "..." }`,
    );
  });
};

/*
|--------------------------------------------------------------------------
| Parse JSON
|--------------------------------------------------------------------------
|
| Supported format A:
|
| {
|   "topicTitle": "DBMS",
|   "subtopicTitle": "Introduction to DBMS",
|   "questions": [...]
| }
|
| Supported format B:
|
| {
|   "topicTitle": "DBMS",
|   "questions": [
|     {
|       "subtopicTitle": "Introduction to DBMS",
|       ...
|     },
|     {
|       "subtopicTitle": "DBMS Architecture",
|       ...
|     }
|   ]
| }
|
*/

const parseQuizPayload = (raw) => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("JSON root must be an object");
  }

  const topicTitle = raw.topicTitle ?? raw.topic;

  if (!isNonEmptyString(topicTitle)) {
    throw new Error("topicTitle must be a non-empty string");
  }

  // Used when subtopicTitle is specified once at the root.
  const defaultSubtopicTitle = raw.subtopicTitle ?? raw.subtopic ?? "";

  const questionsSource = raw.questions ?? raw.question;

  if (!Array.isArray(questionsSource) || questionsSource.length === 0) {
    throw new Error("questions must be a non-empty array");
  }

  const questions = questionsSource.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`questions[${index}] must be an object`);
    }

    /*
    |--------------------------------------------------------------------------
    | Statement
    |--------------------------------------------------------------------------
    */

    if (!isNonEmptyString(item.statement)) {
      throw new Error(
        `questions[${index}].statement must be a non-empty string`,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Subtopic
    |--------------------------------------------------------------------------
    |
    | Priority:
    |
    | 1. Question-level subtopicTitle
    | 2. Question-level subtopic
    | 3. Root-level subtopicTitle
    | 4. Root-level subtopic
    |
    */

    const subtopicTitle =
      item.subtopicTitle ?? item.subtopic ?? defaultSubtopicTitle;

    if (!isNonEmptyString(subtopicTitle)) {
      throw new Error(
        `questions[${index}] needs subtopicTitle, or set subtopicTitle once at the root`,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Correct answer
    |--------------------------------------------------------------------------
    */

    const correct = String(item.correct || "")
      .trim()
      .toLowerCase();

    if (!CORRECT_KEYS.includes(correct)) {
      throw new Error(`questions[${index}].correct must be one of a, b, c, d`);
    }

    /*
    |--------------------------------------------------------------------------
    | Options
    |--------------------------------------------------------------------------
    */

    const option = parseOptions(item.options ?? item.option, index);

    return {
      statement: item.statement.trim(),
      option,
      correct,
      subtopicTitle: subtopicTitle.trim(),
    };
  });

  return {
    topicTitle: topicTitle.trim(),
    questions,
  };
};

/*
|--------------------------------------------------------------------------
| Find subtopic
|--------------------------------------------------------------------------
*/

const findSubtopic = (topic, subtopicTitle) => {
  const wanted = subtopicTitle.trim().toLowerCase();

  return (topic.subtopic || []).find(
    (item) =>
      String(item.title || "")
        .trim()
        .toLowerCase() === wanted,
  );
};

/*
|--------------------------------------------------------------------------
| Main
|--------------------------------------------------------------------------
*/

const main = async () => {
  const fileArg = process.argv[2];

  if (!fileArg) {
    usage();
    process.exit(1);
  }

  if (!process.env.DB_STRING) {
    throw new Error("DB_STRING is missing in backend/.env");
  }

  /*
  |--------------------------------------------------------------------------
  | Resolve JSON file
  |--------------------------------------------------------------------------
  */

  const filePath = await resolveFilePath(fileArg);

  console.log(`Reading quiz file: ${filePath}`);

  const rawJson = await fs.readFile(filePath, "utf8");

  let raw;

  try {
    raw = JSON.parse(rawJson);
  } catch (error) {
    throw new Error(`Invalid JSON file: ${error.message}`);
  }

  /*
  |--------------------------------------------------------------------------
  | Parse and validate
  |--------------------------------------------------------------------------
  */

  const payload = parseQuizPayload(raw);

  console.log(`Topic: ${payload.topicTitle}`);

  console.log(`Questions to import: ${payload.questions.length}`);

  /*
  |--------------------------------------------------------------------------
  | Connect database
  |--------------------------------------------------------------------------
  */

  await connectDb();

  /*
  |--------------------------------------------------------------------------
  | Find topic
  |--------------------------------------------------------------------------
  */

  const topic = await topicModel.findOne({
    title: payload.topicTitle,
  });

  if (!topic) {
    throw new Error(
      `Topic "${payload.topicTitle}" does not exist. Import or create that topic first.`,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Prepare questions
  |--------------------------------------------------------------------------
  */

  const newQuestions = payload.questions.map((item, index) => {
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

  /*
  |--------------------------------------------------------------------------
  | Find existing quiz
  |--------------------------------------------------------------------------
  */

  let quiz = await quizModel.findOne({
    title: topic.title,
  });

  /*
  |--------------------------------------------------------------------------
  | Create quiz if it doesn't exist
  |--------------------------------------------------------------------------
  */

  if (!quiz) {
    quiz = await quizModel.create({
      title: topic.title,
      question: newQuestions,
    });

    console.log("");
    console.log(`Created quiz "${quiz.title}"`);

    console.log(`Added ${newQuestions.length} question(s)`);

    console.log(`Quiz id: ${quiz._id}`);

    console.log(`Topic id: ${topic._id}`);

    return;
  }

  /*
  |--------------------------------------------------------------------------
  | Existing quiz found
  |--------------------------------------------------------------------------
  |
  | Append the new questions instead of throwing an error.
  |
  */

  quiz.question.push(...newQuestions);

  await quiz.save();

  console.log("");
  console.log(`Existing quiz "${quiz.title}" found.`);

  console.log(`Added ${newQuestions.length} new question(s).`);

  console.log(`Total questions in quiz: ${quiz.question.length}`);

  console.log(`Quiz id: ${quiz._id}`);

  console.log(`Topic id: ${topic._id}`);
};

/*
|--------------------------------------------------------------------------
| Execute
|--------------------------------------------------------------------------
*/

main()
  .catch((error) => {
    console.error("");
    console.error("Import failed:");
    console.error(error.message);

    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
