const { GoogleGenAI } = require("@google/genai");

const geminiKeys = [
  process.env.GEMINI_KEY1,
  process.env.GEMINI_KEY2,
  process.env.GEMINI_KEY3,
  process.env.GEMINI_KEY4,
  process.env.GEMINI_KEY5,
  process.env.GEMINI_KEY6,
  process.env.GEMINI_KEY7,
].filter(Boolean);

let currentKeyIndex = 0;

const getNextGeminiClient = () => {
  if (geminiKeys.length === 0) {
    throw new Error("No Gemini API keys configured");
  }

  const apiKey = geminiKeys[currentKeyIndex];

  currentKeyIndex = (currentKeyIndex + 1) % geminiKeys.length;

  return new GoogleGenAI({ apiKey });
};

module.exports = {
  getNextGeminiClient,
};
