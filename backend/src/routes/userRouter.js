const {
  add,
  remove,
  getUsage,
  getAllUsers,
} = require("../controllers/userController.js");

const express = require("express");
const adminMiddleware = require("../middleware/adminMiddleware");
const userMiddleware = require("../middleware/userMiddleware");

const userRouter = express.Router();

userRouter.get("/usage", userMiddleware, getUsage);
userRouter.get("/all", adminMiddleware, getAllUsers);
userRouter.post("/add", adminMiddleware, add);
userRouter.delete("/remove/:id", adminMiddleware, remove);

module.exports = userRouter;
