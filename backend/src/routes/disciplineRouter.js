const express = require("express");
const adminMiddleware = require("../middleware/adminMiddleware.js");
const {
  getDashboard,
  getSummary,
  logActivity,
  deleteLog,
  completeFocusRaid,
  defeatUrgeBoss,
  claimDailyChest,
  createCustomActivity,
  updateActivity,
  updateSettings,
} = require("../controllers/disciplineController.js");

const disciplineRouter = express.Router();

disciplineRouter.use(adminMiddleware);

disciplineRouter.get("/dashboard", getDashboard);
disciplineRouter.get("/summary", getSummary);
disciplineRouter.post("/log", logActivity);
disciplineRouter.delete("/log/:logId", deleteLog);
disciplineRouter.post("/raid/complete", completeFocusRaid);
disciplineRouter.post("/boss/defeat", defeatUrgeBoss);
disciplineRouter.post("/chest/claim", claimDailyChest);
disciplineRouter.post("/activities", createCustomActivity);
disciplineRouter.patch("/activities/:activityId", updateActivity);
disciplineRouter.patch("/settings", updateSettings);

module.exports = disciplineRouter;
