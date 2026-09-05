const usageModel = require("../models/usageModel.js");

const DEFAULT_CODE_DAILY_LIMIT = 15;
const DEFAULT_GEMINI_DAILY_LIMIT = 20;

const getCodeDailyLimit = () => parseLimit(process.env.CODE_DAILY_LIMIT, DEFAULT_CODE_DAILY_LIMIT);
const getGeminiDailyLimit = () =>
  parseLimit(process.env.GEMINI_DAILY_LIMIT, DEFAULT_GEMINI_DAILY_LIMIT);

const parseLimit = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const getUsageDate = () => new Date().toISOString().slice(0, 10);

const isAdminUser = (user) => user?.role === "admin";

const ensureUsageDocument = async (userId, date) => {
  try {
    await usageModel.create({
      userId,
      date,
      codeRuns: 0,
      codeSubmissions: 0,
      geminiCalls: 0,
    });
  } catch (error) {
    if (error?.code !== 11000) {
      throw error;
    }
  }
};

const formatUsage = (doc, user) => {
  if (isAdminUser(user)) {
    return {
      codeOperations: {
        used: 0,
        limit: null,
        remaining: null,
        unlimited: true,
      },
      gemini: {
        used: 0,
        limit: null,
        remaining: null,
        unlimited: true,
      },
    };
  }

  const codeLimit = getCodeDailyLimit();
  const geminiLimit = getGeminiDailyLimit();
  const codeUsed = (doc?.codeRuns || 0) + (doc?.codeSubmissions || 0);
  const geminiUsed = doc?.geminiCalls || 0;

  return {
    codeOperations: {
      used: codeUsed,
      limit: codeLimit,
      remaining: Math.max(0, codeLimit - codeUsed),
    },
    gemini: {
      used: geminiUsed,
      limit: geminiLimit,
      remaining: Math.max(0, geminiLimit - geminiUsed),
    },
  };
};

const getTodayUsage = async (user) => {
  if (isAdminUser(user)) {
    return formatUsage(null, user);
  }

  const date = getUsageDate();
  const doc = await usageModel.findOne({ userId: user._id, date }).lean();
  return formatUsage(doc, user);
};

const consumeCodeOperation = async (user, kind) => {
  if (isAdminUser(user)) {
    return formatUsage(null, user);
  }

  const field = kind === "submit" ? "codeSubmissions" : "codeRuns";
  const date = getUsageDate();
  const limit = getCodeDailyLimit();
  const userId = user._id;

  await ensureUsageDocument(userId, date);

  const updated = await usageModel.findOneAndUpdate(
    {
      userId,
      date,
      $expr: {
        $lt: [{ $add: ["$codeRuns", "$codeSubmissions"] }, limit],
      },
    },
    { $inc: { [field]: 1 } },
    { returnDocument: "after" },
  );

  if (!updated) {
    const current = await usageModel.findOne({ userId, date }).lean();
    const error = new Error("Daily code operation limit reached");
    error.statusCode = 429;
    error.usage = formatUsage(current, user);
    throw error;
  }

  return formatUsage(updated, user);
};

const consumeGeminiCall = async (user) => {
  const date = getUsageDate();

  if (isAdminUser(user)) {
    return { usage: formatUsage(null, user), date };
  }

  const limit = getGeminiDailyLimit();
  const userId = user._id;

  await ensureUsageDocument(userId, date);

  const updated = await usageModel.findOneAndUpdate(
    {
      userId,
      date,
      geminiCalls: { $lt: limit },
    },
    { $inc: { geminiCalls: 1 } },
    { returnDocument: "after" },
  );

  if (!updated) {
    const current = await usageModel.findOne({ userId, date }).lean();
    const error = new Error("Daily Gemini request limit reached");
    error.statusCode = 429;
    error.usage = formatUsage(current, user);
    throw error;
  }

  return { usage: formatUsage(updated, user), date };
};

const refundGeminiCall = async (user, date) => {
  if (isAdminUser(user)) {
    return;
  }

  await usageModel.updateOne(
    { userId: user._id, date, geminiCalls: { $gt: 0 } },
    { $inc: { geminiCalls: -1 } },
  );
};

module.exports = {
  getTodayUsage,
  consumeCodeOperation,
  consumeGeminiCall,
  refundGeminiCall,
  formatUsage,
  getUsageDate,
  isAdminUser,
};
