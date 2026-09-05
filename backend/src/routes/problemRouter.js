const express = require('express')
const problemRouter = express.Router();
const adminMiddleware =require('../middleware/adminMiddleware.js')

const {
  createProblem,
  updateProblem,
  deleteProblem,
  fetchProblem,
  fetchProblemAll,
  fetchSolvedProblem,
  fetchProblemSubmission,
  fetchProblemForUpdate,
  fetchProblemSolution,
} = require("../controllers/problemController.js");
const userMiddleware = require('../middleware/userMiddleware.js');
// create , fetch , update , delete

// .. for admin only 
problemRouter.post("/createProblem", adminMiddleware, createProblem);
problemRouter.patch("/updateProblem/:id", adminMiddleware, updateProblem);
problemRouter.get('/fetchProblemForUpdate/:id' , adminMiddleware , fetchProblemForUpdate);
problemRouter.delete("/deleteProblem/:id", adminMiddleware, deleteProblem);


// for everybody
problemRouter.get("/fetchProblem/:id", userMiddleware, fetchProblem);
problemRouter.get("/fetchProblem/:id/solution", userMiddleware, fetchProblemSolution);
problemRouter.get("/fetchProblemAll", userMiddleware, fetchProblemAll);
problemRouter.get('/fetchSolvedProblem', userMiddleware,fetchSolvedProblem);
problemRouter.get("/fetchProblemSubmission/:pid",userMiddleware, fetchProblemSubmission);


module.exports = problemRouter;