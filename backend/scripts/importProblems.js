require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
});

const fs = require("fs/promises");
const path = require("path");
const mongoose = require("mongoose");
const userModel = require("../src/models/userModel");
const problemModel = require("../src/models/problemModel");
const connectDb = require("../src/config/db");

const ALLOWED_DIFFICULTIES = ["easy", "medium", "hard"];
const ALLOWED_TAGS = [
  "array",
  "string",
  "linkedList",
  "stack",
  "queue",
  "hashing",
  "tree",
  "heap",
  "graph",
  "greedy",
  "dp",
  "recursion",
  "backtracking",
  "binarySearch",
  "bitManipulation",
];
const LANGUAGE_MAP = {
  nodejs: "nodejs",
  javascript: "nodejs",
  js: "nodejs",
  java: "java",
  cpp17: "cpp17",
  "c++": "cpp17",
  cpp: "cpp17",
};
const REQUIRED_LANGUAGES = ["nodejs", "java", "cpp17"];
const VISIBLE_TEST_CASE_COUNT = 3;
const INVISIBLE_TEST_CASE_COUNT = 20;
const OUTPUT_DELIMITER = "__JUDGE_TC_END__";
const USER_SOLUTION_START = "// USER_SOLUTION_START";
const USER_SOLUTION_END = "// USER_SOLUTION_END";

const usage = () => {
  console.error("Usage: node scripts/importProblems.js <path-to-json>");
  console.error("Example: node scripts/importProblems.js problems.example.json");
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

const normalizeLanguage = (value, label) => {
  const mapped = LANGUAGE_MAP[String(value || "").trim().toLowerCase()];
  if (!mapped) {
    throw new Error(`${label} language must be nodejs, java, or cpp17`);
  }
  return mapped;
};

const parseVisibleCases = (cases, problemIndex) => {
  if (!Array.isArray(cases) || cases.length !== VISIBLE_TEST_CASE_COUNT) {
    throw new Error(
      `problems[${problemIndex}].visibleTestCases must contain exactly ${VISIBLE_TEST_CASE_COUNT} cases`,
    );
  }

  return cases.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`problems[${problemIndex}].visibleTestCases[${index}] must be an object`);
    }
    if (!isNonEmptyString(item.input) || !isNonEmptyString(item.output) || !isNonEmptyString(item.explanation)) {
      throw new Error(
        `problems[${problemIndex}].visibleTestCases[${index}] needs input, output, and explanation`,
      );
    }
    return {
      input: item.input,
      output: item.output,
      explanation: item.explanation,
    };
  });
};

const parseHiddenCases = (cases, problemIndex) => {
  if (!Array.isArray(cases) || cases.length !== INVISIBLE_TEST_CASE_COUNT) {
    throw new Error(
      `problems[${problemIndex}].invisibleTestCases must contain exactly ${INVISIBLE_TEST_CASE_COUNT} cases`,
    );
  }

  return cases.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`problems[${problemIndex}].invisibleTestCases[${index}] must be an object`);
    }
    if (!isNonEmptyString(item.input) || !isNonEmptyString(item.output)) {
      throw new Error(
        `problems[${problemIndex}].invisibleTestCases[${index}] needs input and output`,
      );
    }
    return {
      input: item.input,
      output: item.output,
    };
  });
};

const parseCodeList = (list, problemIndex, field, codeKey) => {
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error(`problems[${problemIndex}].${field} must be a non-empty array`);
  }

  const mapped = list.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`problems[${problemIndex}].${field}[${index}] must be an object`);
    }
    if (!isNonEmptyString(item[codeKey])) {
      throw new Error(`problems[${problemIndex}].${field}[${index}].${codeKey} is required`);
    }

    if (field === "referenceSolution") {
      const code = item[codeKey];
      const label = `problems[${problemIndex}].referenceSolution[${index}].completeCode`;
      if (!code.includes(USER_SOLUTION_START) || !code.includes(USER_SOLUTION_END)) {
        throw new Error(
          `${label} must wrap the solution with ${USER_SOLUTION_START} and ${USER_SOLUTION_END}`,
        );
      }
      if (!code.includes(OUTPUT_DELIMITER)) {
        throw new Error(
          `${label} must print ${OUTPUT_DELIMITER} after each test-case answer`,
        );
      }
    }

    return {
      language: normalizeLanguage(item.language, `problems[${problemIndex}].${field}[${index}]`),
      [codeKey]: item[codeKey],
    };
  });

  const languages = new Set(mapped.map((item) => item.language));
  const missing = REQUIRED_LANGUAGES.filter((language) => !languages.has(language));
  if (missing.length > 0) {
    throw new Error(
      `problems[${problemIndex}].${field} must include nodejs, java, and cpp17 (missing ${missing.join(", ")})`,
    );
  }

  return mapped;
};

const parseProblem = (raw, index) => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`problems[${index}] must be an object`);
  }

  if (!isNonEmptyString(raw.title)) {
    throw new Error(`problems[${index}].title is required`);
  }
  if (!isNonEmptyString(raw.description)) {
    throw new Error(`problems[${index}].description is required`);
  }

  const difficulty = String(raw.difficulty || "").trim().toLowerCase();
  if (!ALLOWED_DIFFICULTIES.includes(difficulty)) {
    throw new Error(`problems[${index}].difficulty must be easy, medium, or hard`);
  }

  const tags = String(raw.tags || "").trim();
  if (!ALLOWED_TAGS.includes(tags)) {
    throw new Error(
      `problems[${index}].tags must be one of ${ALLOWED_TAGS.join(", ")}`,
    );
  }

  return {
    title: raw.title.trim(),
    description: raw.description,
    difficulty,
    tags,
    videoUrl: typeof raw.videoUrl === "string" ? raw.videoUrl.trim() : "",
    visibleTestCases: parseVisibleCases(raw.visibleTestCases, index),
    invisibleTestCases: parseHiddenCases(
      raw.invisibleTestCases ?? raw.hiddenTestCases,
      index,
    ),
    startCode: parseCodeList(raw.startCode, index, "startCode", "initialCode"),
    referenceSolution: parseCodeList(
      raw.referenceSolution,
      index,
      "referenceSolution",
      "completeCode",
    ),
  };
};

const parsePayload = (raw) => {
  if (Array.isArray(raw)) {
    return {
      problemCreatorEmail: "",
      problems: raw.map(parseProblem),
    };
  }

  if (!raw || typeof raw !== "object") {
    throw new Error("JSON root must be an object with a problems array, or a problems array");
  }

  const problems = raw.problems;
  if (!Array.isArray(problems) || problems.length === 0) {
    throw new Error("problems must be a non-empty array");
  }

  return {
    problemCreatorEmail: isNonEmptyString(raw.problemCreatorEmail)
      ? raw.problemCreatorEmail.trim().toLowerCase()
      : "",
    problems: problems.map(parseProblem),
  };
};

const resolveCreator = async (email) => {
  if (email) {
    const user = await userModel.findOne({ email });
    if (!user) {
      throw new Error(`No user found with email ${email}`);
    }
    return user;
  }

  const admin = await userModel.findOne({ role: "admin" }).sort({ createdAt: 1 });
  if (!admin) {
    throw new Error("No admin user found. Set problemCreatorEmail in the JSON.");
  }
  return admin;
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
  const payload = parsePayload(JSON.parse(await fs.readFile(filePath, "utf8")));

  await connectDb();

  const creator = await resolveCreator(payload.problemCreatorEmail);
  const titles = payload.problems.map((item) => item.title);
  const existing = await problemModel.find({ title: { $in: titles } }).select("title");
  const existingTitles = new Set(existing.map((item) => item.title));

  const toCreate = payload.problems
    .filter((item) => {
      if (existingTitles.has(item.title)) {
        console.log(`Skipped existing problem "${item.title}"`);
        return false;
      }
      return true;
    })
    .map((item) => ({
      ...item,
      problemCreator: creator._id,
    }));

  if (toCreate.length === 0) {
    throw new Error("No new problems to create. Every title already exists.");
  }

  const created = await problemModel.insertMany(toCreate);

  console.log(`Created ${created.length} problem(s) as ${creator.email}`);
  created.forEach((item, index) => {
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
