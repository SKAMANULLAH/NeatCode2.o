const problemModel = require("../models/problemModel.js");
const submissionModel = require("../models/submissionModel.js");
const runTestCases = require("../utils/runTestCases.js");
const isValidObjectId = require("../utils/objectId.js");
const { validateCodeRequest } = require("../utils/validateCodeRequest.js");
const { consumeCodeOperation } = require("../utils/usageService.js");

const sendError = (res, status, message) => {
  return res.status(status).json({ message });
};

const submitCode = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.id;
    const { code, language, versionIndex } = req.body;

    if (!isValidObjectId(problemId)) {
      return sendError(res, 400, "Invalid problem ID");
    }

    const validationError = validateCodeRequest({
      problemId,
      code,
      language,
      versionIndex,
    });
    if (validationError) {
      return sendError(res, 400, validationError);
    }

    const problem = await problemModel.findById(problemId);

    if (!problem) {
      return sendError(res, 404, "Problem not found");
    }

    const referenceSolution = problem.referenceSolution.find(
      (obj) => obj.language === language,
    );

    if (!referenceSolution) {
      return sendError(
        res,
        400,
        "Reference solution not available for this language",
      );
    }

    const testCases = problem.invisibleTestCases;

    if (!testCases) {
      return sendError(
        res,
        400,
        "Test Cases are required",
      );
    }

    let usage;
    try {
      usage = await consumeCodeOperation(req.result, "submit");
    } catch (limitError) {
      if (limitError.statusCode === 429) {
        return res.status(429).json({
          message: limitError.message,
          usage: limitError.usage,
        });
      }
      throw limitError;
    }

    const submission = await submissionModel.create({
      userId,
      problemId,
      code,
      language,
      status: "pending",
      testCasesPassed: 0,
      testCasesTotal: testCases.length,
      time: 0,
      memory: 0,
      errorMessage: "",
    });

    const result = await runTestCases(
      {
        testCases,
        referenceSolution,
        sourceCode: code,
        language,
        versionIndex,
      },
      testCases.length,
    );

    submission.status = result.status;
    submission.testCasesPassed = result.testCasesPassed;
    submission.time = result.time;
    submission.memory = result.memory;

    if (result.error) {
      submission.errorMessage = result.error;
    }

    await submission.save();

    let solved = req.result.problemSolved.some(
      (id) => String(id) === String(problemId),
    );

    if (result.status === "accepted" && !solved) {
      req.result.problemSolved.push(problemId);
      await req.result.save();
      solved = true;
    }

    if (result.status === "accepted") {
      solved = true;
    }

    const safeSubmission = submission.toObject();

    return res.status(200).json({
      message: result.status,
      status: result.status,
      passed: result.testCasesPassed,
      total: testCases.length,
      testCasesPassed: result.testCasesPassed,
      testCasesTotal: testCases.length,
      testCase: result.status === "wrongAnswer" ? result.testCase : undefined,
      error: result.error || null,
      solved,
      usage,
      submission: {
        _id: safeSubmission._id,
        status: safeSubmission.status,
        language: safeSubmission.language,
        time: safeSubmission.time,
        memory: safeSubmission.memory,
        testCasesPassed: safeSubmission.testCasesPassed,
        testCasesTotal: safeSubmission.testCasesTotal,
        createdAt: safeSubmission.createdAt,
      },
    });
  } catch (error) {
    console.error("Submission Error:", error.response?.data || error.message);

    return res.status(500).json({
      message: "Code submission failed",
    });
  }
};

const runCode = async (req, res) => {
  try {
    const problemId = req.params.id;
    const { code, language, versionIndex } = req.body;

    if (!isValidObjectId(problemId)) {
      return sendError(res, 400, "Invalid problem ID");
    }

    const validationError = validateCodeRequest({
      problemId,
      code,
      language,
      versionIndex,
    });
    if (validationError) {
      return sendError(res, 400, validationError);
    }

    const problem = await problemModel.findById(problemId);

    if (!problem) {
      return sendError(res, 404, "Problem not found");
    }

    const referenceSolution = problem.referenceSolution.find(
      (obj) => obj.language === language,
    );

    if (!referenceSolution) {
      return sendError(
        res,
        400,
        "Reference solution not available for this language",
      );
    }

    const testCases = problem.visibleTestCases;

    if (!testCases || testCases.length ===0) {
      return sendError(res, 400, "No test cases available");
    }

    let usage;
    try {
      usage = await consumeCodeOperation(req.result, "run");
    } catch (limitError) {
      if (limitError.statusCode === 429) {
        return res.status(429).json({
          message: limitError.message,
          usage: limitError.usage,
        });
      }
      throw limitError;
    }

    const result = await runTestCases(
      {
        testCases,
        referenceSolution,
        sourceCode: code,
        language,
        versionIndex,
      },
      testCases.length,
    );

    return res.status(200).json({
      message: result.status,
      failedTestCase: result.input || null,
      testCasesPassed: result.testCasesPassed,
      testCasesTotal: testCases.length,
      expected: result.expected || null,
      actual: result.actual || null,
      error: result.error || null,
      usage,
    });
  } catch (error) {
    console.error("Run Error:", error.response?.data || error.message);

    return res.status(500).json({
      message: "Code execution failed",
    });
  }
};

module.exports = { submitCode, runCode };
