
require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
});

const fs = require("fs/promises");
const path = require("path");
const mongoose = require("mongoose");

const topicModel = require("../src/models/topicModel");
const connectDb = require("../src/config/db");

/* =========================================================
   USAGE
   ========================================================= */

const usage = () => {
  console.error("Usage:");
  console.error("  node scripts/topic.js <path-to-json>");
  console.error("");
  console.error("Examples:");
  console.error("  node scripts/topic.js scripts/topic.create.json");
  console.error("  node scripts/topic.js scripts/topic.add-subtopic.json");
};

/* =========================================================
   HELPERS
   ========================================================= */

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

/* =========================================================
   VALIDATE ONE SUBTOPIC
   ========================================================= */

const validateSubtopic = (item, index = null) => {
  const prefix = index !== null ? `subtopic[${index}]` : "subtopic";

  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new Error(`${prefix} must be an object`);
  }

  if (!isNonEmptyString(item.title)) {
    throw new Error(`${prefix}.title must be a non-empty string`);
  }

  if (typeof item.content !== "string") {
    throw new Error(`${prefix}.content must be a string`);
  }

  return {
    title: item.title.trim(),
    content: item.content,
  };
};

/* =========================================================
   VALIDATE SUBTOPIC ARRAY
   ========================================================= */

const validateSubtopics = (subtopicSource) => {
  if (!Array.isArray(subtopicSource) || subtopicSource.length === 0) {
    throw new Error("subtopic must be a non-empty array");
  }

  return subtopicSource.map((item, index) =>
    validateSubtopic(item, index),
  );
};

/* =========================================================
   CREATE TOPIC VALIDATION
   ========================================================= */

const parseCreatePayload = (raw) => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error('For "create", JSON root must be an object');
  }

  if (raw.operation !== "create") {
    throw new Error('Create JSON must contain "operation": "create"');
  }

  if (!isNonEmptyString(raw.title)) {
    throw new Error("title must be a non-empty string");
  }

  /*
   * Support:
   *
   * "subtopic": [...]
   *
   * Also accepts:
   *
   * "subtopics": [...]
   */

  const subtopicSource = raw.subtopic ?? raw.subtopics;

  const subtopic = validateSubtopics(subtopicSource);

  return {
    title: raw.title.trim(),
    subtopic,
  };
};

/* =========================================================
   ADD SUBTOPIC VALIDATION
   ========================================================= */

const parseAddSubtopicPayload = (raw) => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error('For "add-subtopic", JSON root must be an object');
  }

  if (raw.operation !== "add-subtopic") {
    throw new Error(
      'Add-subtopic JSON must contain "operation": "add-subtopic"',
    );
  }

  /*
   * Topic can be identified using either:
   *
   * 1. topicTitle
   * 2. topicId
   *
   * Exactly one is required.
   */

  const hasTopicTitle = isNonEmptyString(raw.topicTitle);
  const hasTopicId = isNonEmptyString(raw.topicId);

  if (!hasTopicTitle && !hasTopicId) {
    throw new Error('Provide either "topicTitle" or "topicId"');
  }

  if (hasTopicTitle && hasTopicId) {
    throw new Error('Provide only one of "topicTitle" or "topicId"');
  }

  /*
   * Support BOTH:
   *
   * "subtopic": {
   *   "title": "...",
   *   "content": "..."
   * }
   *
   * AND
   *
   * "subtopic": [
   *   {...},
   *   {...}
   * ]
   */

  let subtopic;

  if (Array.isArray(raw.subtopic)) {
    /*
     * Multiple subtopics
     */
    subtopic = validateSubtopics(raw.subtopic);
  } else {
    /*
     * Single subtopic
     */
    subtopic = [validateSubtopic(raw.subtopic)];
  }

  return {
    topicTitle: hasTopicTitle ? raw.topicTitle.trim() : null,

    topicId: hasTopicId ? raw.topicId.trim() : null,

    subtopic,
  };
};

/* =========================================================
   CREATE NEW TOPIC
   ========================================================= */

const createTopic = async (payload) => {
  /*
   * Check whether topic already exists
   */

  const existing = await topicModel.findOne({
    title: payload.title,
  });

  if (existing) {
    throw new Error(
      `Topic "${payload.title}" already exists. ` +
        `Use "add-subtopic" if you want to add subtopics to it.`,
    );
  }

  /*
   * Create topic
   */

  const topic = await topicModel.create({
    title: payload.title,
    subtopic: payload.subtopic,
  });

  console.log("");

  console.log(
    `Created topic "${topic.title}" with ${topic.subtopic.length} subtopic(s)`,
  );

  console.log(`Topic id: ${topic._id}`);

  topic.subtopic.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.title} (${item._id})`);
  });

  console.log("");
};

/* =========================================================
   ADD SUBTOPICS TO EXISTING TOPIC
   ========================================================= */

const addSubtopic = async (payload) => {
  let topic;

  /* ---------------------------------------------------------
     FIND TOPIC USING topicId
     --------------------------------------------------------- */

  if (payload.topicId) {
    if (!mongoose.Types.ObjectId.isValid(payload.topicId)) {
      throw new Error(`Invalid MongoDB topicId: "${payload.topicId}"`);
    }

    topic = await topicModel.findById(payload.topicId);
  }

  /* ---------------------------------------------------------
     FIND TOPIC USING topicTitle
     --------------------------------------------------------- */

  if (payload.topicTitle) {
    topic = await topicModel.findOne({
      title: payload.topicTitle,
    });
  }

  /* ---------------------------------------------------------
     TOPIC NOT FOUND
     --------------------------------------------------------- */

  if (!topic) {
    const identifier = payload.topicTitle
      ? `"${payload.topicTitle}"`
      : `"${payload.topicId}"`;

    throw new Error(`Topic ${identifier} was not found`);
  }

  /* ---------------------------------------------------------
     CHECK FOR DUPLICATE SUBTOPICS
     --------------------------------------------------------- */

  for (const newSubtopic of payload.subtopic) {
    const existingSubtopic = topic.subtopic.find(
      (item) =>
        item.title.trim().toLowerCase() ===
        newSubtopic.title.trim().toLowerCase(),
    );

    if (existingSubtopic) {
      throw new Error(
        `Subtopic "${newSubtopic.title}" already exists ` +
          `inside topic "${topic.title}"`,
      );
    }
  }

  /*
   * Also check for duplicate titles INSIDE the incoming JSON.
   *
   * Example:
   *
   * [
   *   { title: "DBMS" },
   *   { title: "DBMS" }
   * ]
   */

  const incomingTitles = new Set();

  for (const newSubtopic of payload.subtopic) {
    const normalizedTitle = newSubtopic.title.trim().toLowerCase();

    if (incomingTitles.has(normalizedTitle)) {
      throw new Error(
        `Duplicate subtopic "${newSubtopic.title}" found in the input JSON`,
      );
    }

    incomingTitles.add(normalizedTitle);
  }

  /* ---------------------------------------------------------
     ADD ALL SUBTOPICS
     --------------------------------------------------------- */

  topic.subtopic.push(...payload.subtopic);

  await topic.save();

  /* ---------------------------------------------------------
     GET NEWLY ADDED SUBTOPICS
     --------------------------------------------------------- */

  const startIndex =
    topic.subtopic.length - payload.subtopic.length;

  const addedSubtopics = topic.subtopic.slice(startIndex);

  /* ---------------------------------------------------------
     OUTPUT
     --------------------------------------------------------- */

  console.log("");

  console.log(
    `Added ${addedSubtopics.length} subtopic(s) ` +
      `to topic "${topic.title}"`,
  );

  console.log(`Topic id: ${topic._id}`);

  addedSubtopics.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.title} (${item._id})`);
  });

  console.log(`Total subtopics: ${topic.subtopic.length}`);

  console.log("");
};

/* =========================================================
   MAIN
   ========================================================= */

const main = async () => {
  const fileArg = process.argv[2];

  /* ---------------------------------------------------------
     CHECK FILE ARGUMENT
     --------------------------------------------------------- */

  if (!fileArg) {
    usage();
    process.exit(1);
  }

  /* ---------------------------------------------------------
     CHECK DATABASE ENVIRONMENT VARIABLE
     --------------------------------------------------------- */

  if (!process.env.DB_STRING) {
    throw new Error("DB_STRING is missing in backend/.env");
  }

  /* ---------------------------------------------------------
     RESOLVE JSON FILE
     --------------------------------------------------------- */

  const filePath = path.resolve(process.cwd(), fileArg);

  const fileText = await fs.readFile(filePath, "utf8");

  /* ---------------------------------------------------------
     PARSE JSON
     --------------------------------------------------------- */

  let raw;

  try {
    raw = JSON.parse(fileText);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }

  /* ---------------------------------------------------------
     DETERMINE OPERATION
     --------------------------------------------------------- */

  if (raw.operation === "create") {
    const payload = parseCreatePayload(raw);

    await connectDb();

    await createTopic(payload);
  } else if (raw.operation === "add-subtopic") {
    const payload = parseAddSubtopicPayload(raw);

    await connectDb();

    await addSubtopic(payload);
  } else {
    throw new Error(
      'Invalid operation. Use either "create" or "add-subtopic".',
    );
  }
};

/* =========================================================
   RUN
   ========================================================= */

main()
  .catch((error) => {
    console.error("");
    console.error(`Error: ${error.message}`);
    console.error("");
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

