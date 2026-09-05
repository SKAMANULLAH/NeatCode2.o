const problemModel = require("../models/problemModel.js");
const submissionModel = require("../models/submissionModel.js");
const userModel = require("../models/userModel.js");
const isValidObjectId = require("../utils/objectId.js");
const escapeRegex = require("../utils/escapeRegex.js");
const { isAdminUser } = require("../utils/usageService.js");

const PROBLEM_LIST_FIELDS = "_id title difficulty tags";
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
const ALLOWED_STATUS = ["all", "solved", "unsolved"];

const hasSolvedProblem = (user, problemId) => {
  return (user?.problemSolved || []).some(
    (id) => String(id) === String(problemId),
  );
};

const withSolvedFlag = (problems, user) => {
  const solvedIds = new Set(
    (user?.problemSolved || []).map((id) => String(id)),
  );

  return problems.map((problem) => {
    const obj = problem.toObject ? problem.toObject() : problem;
    return {
      _id: obj._id,
      title: obj.title,
      difficulty: obj.difficulty,
      tags: obj.tags,
      solved: solvedIds.has(String(obj._id)),
    };
  });
};

const createProblem = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Bad request" });
    }

    if (!req.result || !req.result._id) {
      return res.status(401).json({ message: "Unauthorized!" });
    }

    req.body.problemCreator = req.result._id;

    const obj = await problemModel.create(req.body);

    return res.status(201).json({message : "Problem created successfully"});
  } catch (err) {
    console.error(err);
    return res.status(400).json({message :"Required fields are not given!"});
  }
};

const updateProblem = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({message  :"Bad request"});
    }
    
    if (!req.params.id) {
      return res.status(400).json({message :"Id is required"});
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid problem ID" });
    }
    
    const obj = await problemModel.findById(req.params.id);
    
    if (!obj) {
      return res.status(404).json({message : "Problem not found"});
    }

    for (const keys in req.body) {
      obj[keys] = req.body[keys];
    }

    await obj.save({ runValidators: true });

    return res.status(200).json({problem : obj});
  } catch (err) {
    console.error(err);
    return res.status(400).json({message: "Required fields are not given!" });
  }
};

const deleteProblem = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({message : "Id is required"});
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid problem ID" });
    }

    const result = await problemModel.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({message : "Problem not found"});
    }

    return res.status(200).json({message : "Problem deleted successfully"});
  } catch (err) {
    console.error(err);
    return res.status(400).json({message : "Something went wrong!"});
  }
};

const buildProblemListFilter = (req) => {
  const filter = {};
  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : "";

  if (search.length > 100) {
    return { error: "Search query is too long" };
  }

  if (search) {
    filter.title = { $regex: escapeRegex(search), $options: "i" };
  }

  const difficulty =
    typeof req.query.difficulty === "string" ? req.query.difficulty : "all";
  if (difficulty && difficulty !== "all") {
    if (!ALLOWED_DIFFICULTIES.includes(difficulty)) {
      return { error: "Invalid difficulty" };
    }
    filter.difficulty = difficulty;
  }

  const tag = typeof req.query.tag === "string" ? req.query.tag : "all";
  if (tag && tag !== "all") {
    if (!ALLOWED_TAGS.includes(tag)) {
      return { error: "Invalid tag" };
    }
    filter.tags = tag;
  }

  const status =
    typeof req.query.status === "string" ? req.query.status : "all";
  if (status && status !== "all") {
    if (!ALLOWED_STATUS.includes(status)) {
      return { error: "Invalid status" };
    }

    const solvedIds = req.result?.problemSolved || [];
    if (status === "solved") {
      filter._id = { $in: solvedIds };
    } else if (status === "unsolved") {
      filter._id = { $nin: solvedIds };
    }
  }

  return { filter };
};

const fetchProblem = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ message: "Problem ID is required" });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid problem ID" });
    }

    const obj = await problemModel
      .findById(req.params.id)
      .select(
        "_id title description difficulty tags visibleTestCases startCode videoUrl",
      )
      .lean();

    if (!obj) {
      return res.status(404).json({
        message: "Problem not found !",
      });
    }

    return res.status(200).json({
      ...obj,
      solved: hasSolvedProblem(req.result, obj._id),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Something went wrong !",
    });
  }
};

const fetchProblemSolution = async (req, res) => {
  try {
    if (!req.params.id || !isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid problem ID" });
    }

    const problem = await problemModel
      .findById(req.params.id)
      .select("referenceSolution")
      .lean();

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    if (isAdminUser(req.result)) {
      return res.status(200).json({
        referenceSolution: problem.referenceSolution || [],
      });
    }

    let solved = hasSolvedProblem(req.result, req.params.id);

    if (!solved) {
      const accepted = await submissionModel.exists({
        userId: req.result._id,
        problemId: req.params.id,
        status: "accepted",
      });

      if (accepted) {
        solved = true;
        const alreadyListed = hasSolvedProblem(req.result, req.params.id);
        if (!alreadyListed) {
          req.result.problemSolved.push(req.params.id);
          await req.result.save();
        }
      }
    }

    if (!solved) {
      return res.status(403).json({
        message: "You can only see the solution after solving this problem.",
      });
    }

    return res.status(200).json({
      referenceSolution: problem.referenceSolution || [],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Failed to fetch solution",
    });
  }
};

const fetchProblemAll = async (req, res) => {
  try {
    const built = buildProblemListFilter(req);
    if (built.error) {
      return res.status(400).json({ message: built.error });
    }

    const filter = built.filter;
    const hasPaginationQuery =
      req.query.page !== undefined || req.query.limit !== undefined;

    const totalProblems = await problemModel.countDocuments();
    const solvedCount = req.result?.problemSolved?.length || 0;

    if (!hasPaginationQuery) {
      const problems = await problemModel
        .find(filter)
        .select(PROBLEM_LIST_FIELDS)
        .lean();

      return res.status(200).json({
        problems: withSolvedFlag(problems, req.result),
        totalProblems,
        solvedCount,
      });
    }

    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;
    const matchingCount = await problemModel.countDocuments(filter);
    const totalPages = Math.ceil(matchingCount / limit) || 1;

    const problems = await problemModel
      .find(filter)
      .select(PROBLEM_LIST_FIELDS)
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(200).json({
      problems: withSolvedFlag(problems, req.result),
      totalProblems,
      solvedCount,
      pagination: {
        currentPage: page,
        totalPages,
        totalProblems: matchingCount,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      message: "Something went wrong !",
    });
  }
};
const fetchSolvedProblem = async (req, res) => {
  try {
    if (!req.result) {
      return res.status(401).json({
        message: "Unauthorized access !",
      });
    }

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const userId = req.result._id;

    if (!req.query.page && !req.query.limit) {
      const user = await userModel.findById(userId).populate({
        path: "problemSolved",
        select: "_id title difficulty tags",
      });

      return res.status(200).json({
        problems: user?.problemSolved ?? [],
      });
    }

    const user = await userModel.findById(userId);

    const totalProblems = user.problemSolved.length;
    const totalPages = Math.ceil(totalProblems / limit);

    const skip = (page - 1) * limit;

    const problems = await user.populate({
      path: "problemSolved",
      select: "_id title difficulty tags",
      options: {
        skip,
        limit,
      },
    });

    return res.status(200).json({
      problems: problems.problemSolved,
      pagination: {
        currentPage: page,
        totalPages,
        totalProblems,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      message: "Something went wrong !",
    });
  }
};
const fetchProblemSubmission = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.pid;

    if (!isValidObjectId(problemId)) {
      return res.status(400).json({ message: "Invalid problem ID" });
    }

    const data = await submissionModel.find({ userId, problemId });
    if (data.length == 0) return res.send("No submissions");
    else return res.status(200).send(data);
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error !",
    });
  }
};

const fetchProblemForUpdate = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        message: "Problem ID is required",
      });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid problem ID" });
    }

    const problem = await problemModel.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found",
      });
    }

    return res.status(200).json(problem);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch problem",
    });
  }
};

module.exports = {
  createProblem,
  updateProblem,
  deleteProblem,
  fetchProblem,
  fetchProblemAll,
  fetchSolvedProblem,
  fetchProblemSubmission,
  fetchProblemForUpdate,
  fetchProblemSolution,
};
