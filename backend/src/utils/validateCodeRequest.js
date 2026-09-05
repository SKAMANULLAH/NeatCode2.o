const ALLOWED_LANGUAGES = ["nodejs", "cpp17", "java"];

const validateCodeRequest = ({ problemId, code, language, versionIndex }) => {
  if (!problemId || !isNonEmptyString(code) || !language || versionIndex === undefined) {
    return "Some fields are missing";
  }

  if (!ALLOWED_LANGUAGES.includes(language)) {
    return "Invalid language";
  }

  if (typeof code !== "string" || code.length > 100000) {
    return "Invalid code";
  }

  const version = Number(versionIndex);
  if (!Number.isFinite(version) || version < 0 || version > 100) {
    return "Invalid versionIndex";
  }

  return null;
};

const isNonEmptyString = (value) => {
  return typeof value === "string" && value.trim().length > 0;
};

module.exports = {
  validateCodeRequest,
  ALLOWED_LANGUAGES,
};
