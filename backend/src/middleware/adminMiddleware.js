const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

// it will check and verify the jwt token and find that obj in db collection
const adminMiddleware = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      throw new Error("Token is not present !");
    }
    const payload = jwt.verify(token, process.env.JWT_KEY);
    if (payload.role != "admin")
      return res.status(401).json({message:"Unaurhorized access"});
    const { _id } = payload;
    if (!_id) {
      throw new Error("Invalid token !");
    }
    const result = await userModel.findById(_id);
    if (!result) {
      throw new Error("User does not exist");
    }
    if (result.role != "admin")
      return res.status(401).json({message:"Unaurhorized access"});
    req.result = result;
    next();
  } catch (error) {
return res.status(401).json({
  message: error.message,
});    }
};

module.exports = adminMiddleware;
