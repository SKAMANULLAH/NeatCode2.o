const express = require('express')
const codeRouter = express.Router();
const userMiddleware = require('../middleware/userMiddleware.js');
const {submitCode , runCode} = require('../controllers/codeController.js');

codeRouter.post("/submit/:id", userMiddleware, submitCode);
codeRouter.post("/run/:id", userMiddleware, runCode);
module.exports = codeRouter;



