const { fetchQuiz, fetchQuizAll, fetchRandom, createQuiz, updateQuiz  } = require("../controllers/quizController.js");

const express = require("express");
const userMiddleware = require("../middleware/userMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware.js");


const quizRouter = express.Router();

quizRouter.get("/fetchQuizAll", userMiddleware, fetchQuizAll);
quizRouter.get("/fetchRandom", userMiddleware, fetchRandom);
quizRouter.get("/fetchQuiz/:title", userMiddleware, fetchQuiz);
quizRouter.post('/createQuiz',adminMiddleware , createQuiz);
quizRouter.patch("/updateQuiz/:title", adminMiddleware, updateQuiz);
quizRouter.patch("/updateQuiz", adminMiddleware, updateQuiz);


module.exports = quizRouter;
