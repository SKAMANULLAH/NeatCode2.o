const express = require('express');
const userMiddleware = require('../middleware/userMiddleware');
const chatController = require('../controllers/chatController');
const chatRouter = express.Router();



chatRouter.post('/ai' , userMiddleware , chatController);
module.exports = chatRouter;