const express = require("express");
const authRouter = express.Router();
const {
  register,
  login,
  logout,
  googleAuthStart,
  googleAuthCallback,
} = require("../controllers/authController.js");
const userMiddleware = require("../middleware/userMiddleware.js");

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", userMiddleware, logout);

authRouter.get("/google", googleAuthStart);
authRouter.get("/google/callback", googleAuthCallback);

authRouter.get("/check", userMiddleware, async (req, res) => {
  const reply = {
    email: req.result.email,
    firstName: req.result.firstName,
    _id: req.result._id,
    role: req.result.role,
  };
  res.status(200).json({
    user: reply,
    message: "The user is valid ",
  });
});

module.exports = authRouter;
