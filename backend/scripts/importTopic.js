require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
});

const fs = require("fs/promises");
const path = require("path");
const mongoose = require("mongoose");
const topicModel = require("../src/models/topicModel");
const connectDb = require("../src/config/db");

const usage = () => {
  console.error("Usage: node scripts/importTopic.js <path-to-json>");
  console.error("Example: node scripts/importTopic.js scripts/topic.example.json");
};

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const parseTopicPayload = (raw) => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("JSON root must be an object with title and subtopic");
  }

  if (!isNonEmptyString(raw.title)) {
    throw new Error("title must be a non-empty string");
  }

  const subtopicSource = raw.subtopic ?? raw.subtopics;

  if (!Array.isArray(subtopicSource) || subtopicSource.length === 0) {
    throw new Error("subtopic must be a non-empty array");
  }

  const subtopic = subtopicSource.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`subtopic[${index}] must be an object`);
    }
    if (!isNonEmptyString(item.title)) {
      throw new Error(`subtopic[${index}].title must be a non-empty string`);
    }
    if (typeof item.content !== "string") {
      throw new Error(`subtopic[${index}].content must be a string`);
    }

    return {
      title: item.title.trim(),
      content: item.content,
    };
  });

  return {
    title: raw.title.trim(),
    subtopic,
  };
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

  const filePath = path.resolve(process.cwd(), fileArg);
  const fileText = await fs.readFile(filePath, "utf8");
  const payload = parseTopicPayload(JSON.parse(fileText));

  await connectDb();

  const existing = await topicModel.findOne({ title: payload.title });
  if (existing) {
    throw new Error(`Topic "${payload.title}" already exists`);
  }

  const topic = await topicModel.create(payload);

  console.log(`Created topic "${topic.title}" with ${topic.subtopic.length} subtopic(s)`);
  console.log(`Topic id: ${topic._id}`);
  topic.subtopic.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.title} (${item._id})`);
  });
};

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
