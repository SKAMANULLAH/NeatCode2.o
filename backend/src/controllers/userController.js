const userModel = require("../models/userModel.js");
const validate = require("../utils/validate.js");
const bcrypt = require("bcrypt");
const { getTodayUsage } = require("../utils/usageService.js");

const add = async (req, res) => {
  try {
    if (!req.result) {
      return res.status(400).json({ message: "Unauthorized Access !" });
    }
    if (!req.body) {
      return res.status(400).json({ message: "Bad request !" });
    }

    validate(req.body);

    const temp = await userModel.findOne({ email: req.body.email });
    if (temp) {
      return res.status(400).json({
        message: `An user with emailId ${req.body.email} already exists !`,
      });
    }

    req.body.password = await bcrypt.hash(req.body.password, 10);


    const user = await userModel.create(req.body);

    return res.status(201).json({ message: "Registered successfully " });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.result && req.result._id.toString() === id) {
      return res.status(400).json({
        message: "You cannot delete your own admin account!",
      });
    }

    const deleted = await userModel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "User deleted successfully" });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await userModel
      .find({}, "firstName lastName email role age createdAt updatedAt")
      .sort({ createdAt: -1 });

    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to fetch users",
    });
  }
};

const getUsage = async (req, res) => {
  try {
    if (!req.result) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const usage = await getTodayUsage(req.result);
    return res.status(200).json(usage);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch usage" });
  }
};

module.exports = { add, remove, getUsage, getAllUsers };
