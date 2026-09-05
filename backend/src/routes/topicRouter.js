const { fetchTopic, fetchTopicAll, createTopic, updateTopic } = require("../controllers/topicController.js");

const express = require("express");
const userMiddleware = require("../middleware/userMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware.js");


const topicRouter = express.Router();

topicRouter.post("/createTopic", adminMiddleware, createTopic);
topicRouter.patch("/updateTopic/:id", adminMiddleware, updateTopic);
topicRouter.get("/fetchTopic/:id", userMiddleware, fetchTopic);
topicRouter.get("/fetchTopicAll", userMiddleware, fetchTopicAll);

module.exports = topicRouter;
