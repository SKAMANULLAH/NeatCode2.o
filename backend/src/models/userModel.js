const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    firstName: { type: String, required: true, minLength: 2, maxLength: 20 },
    lastName: { type: String, minLength: 2, maxLength: 20 },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      immutable: true,
    },
    age: { type: Number, min: 6, max: 80 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    problemSolved: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "problem",
        },
      ],
    },
    googleId: { type: String, unique: true, sparse: true },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
  },
  { timestamps: true },
);


const userModel = mongoose.model("user", userSchema);

module.exports = userModel;
