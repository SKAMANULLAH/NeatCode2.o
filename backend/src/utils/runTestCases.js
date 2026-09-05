const axios = require("axios");

const { getNextJDoodleAccount } = require("../config/jdoodleAccounts.js");

const OUTPUT_DELIMITER = "__JUDGE_TC_END__";

const normalizeOutput = (output) => {
  return String(output ?? "")
    .replace(/\r\n/g, "\n")
    .trim();
};

const runTestCases = async ({
  testCases,
  referenceSolution,
  sourceCode,
  language,
  versionIndex,
} , count) => {
  const TEST_CASE_COUNT = count;
  if (!testCases || testCases.length !== TEST_CASE_COUNT) {
    throw new Error(
      `Expected exactly ${TEST_CASE_COUNT} test cases, ` +
        `but received ${testCases?.length || 0}`,
    );
  }

  const startMarker = "// USER_SOLUTION_START";
  const endMarker = "// USER_SOLUTION_END";

  const completeCode = referenceSolution.completeCode;

  const startIndex = completeCode.indexOf(startMarker);
  const endIndex = completeCode.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error("Reference solution markers not found");
  }

  if (startIndex >= endIndex) {
    throw new Error("Invalid reference solution markers");
  }

  const beforeUserSolution = completeCode.substring(
    0,
    startIndex + startMarker.length,
  );

  const afterUserSolution = completeCode.substring(endIndex);

  const finalCode =
    beforeUserSolution + "\n" + sourceCode + "\n" + afterUserSolution;

  const combinedInput = testCases
    .map((testCase) => testCase.input.trim())
    .join("\n");

  let totalTime = 0;
  let maxMemory = 0;

  try {
  
    const account = getNextJDoodleAccount();

    
    const response = await axios.post("https://api.jdoodle.com/v1/execute", {
      clientId: account.clientId,
      clientSecret: account.clientSecret,

      script: finalCode,

      stdin: combinedInput,

      language,

      versionIndex,

      compileOnly: false,
    });

    const result = response.data;

    totalTime = Number(result.cpuTime) || 0;

    maxMemory = Number(result.memory) || 0;

    if (!result.isExecutionSuccess) {
      return {
        status: "runtimeError",

        testCasesPassed: 0,

        time: totalTime,

        memory: maxMemory,

        error: result.output || result.error || "Code execution failed",
      };
    }

    const rawOutput = result.output || "";

    
    const actualOutputs = rawOutput
      .split(OUTPUT_DELIMITER)
      .slice(0, TEST_CASE_COUNT)
      .map(normalizeOutput);

    if (actualOutputs.length !== TEST_CASE_COUNT) {
      return {
        status: "runtimeError",

        testCasesPassed: 0,

        time: totalTime,

        memory: maxMemory,

        error:
          `Expected ${TEST_CASE_COUNT} test-case outputs, ` +
          `but received ${actualOutputs.length}.`,
      };
    }

    for (let i = 0; i < TEST_CASE_COUNT; i++) {
      const expectedOutput = normalizeOutput(testCases[i].output);

      const actualOutput = actualOutputs[i];

      if (actualOutput !== expectedOutput) {
        return {
          status: "wrongAnswer",

          testCase: i + 1,

          testCasesPassed: i,

          time: totalTime,

          memory: maxMemory,

          expected: testCases[i].output,

          actual: actualOutput,

          input: testCases[i].input,
        };
      }
    }

    return {
      status: "accepted",

      testCasesPassed: TEST_CASE_COUNT,

      time: totalTime,

      memory: maxMemory,
    };
  } catch (error) {
    return {
      status: "runtimeError",

      testCasesPassed: 0,

      time: totalTime,

      memory: maxMemory,

      error:
        error.response?.data?.error || error.message || "Code execution failed",
    };
  }
};

module.exports = runTestCases;
