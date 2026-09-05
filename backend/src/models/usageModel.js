const mongoose = require("mongoose");
const { Schema } = mongoose;

const usageSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    codeRuns: {
      type: Number,
      default: 0,
      min: 0,
    },
    codeSubmissions: {
      type: Number,
      default: 0,
      min: 0,
    },
    geminiCalls: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

usageSchema.index({ userId: 1, date: 1 }, { unique: true });

const usageModel = mongoose.model("usage", usageSchema);

module.exports = usageModel;
