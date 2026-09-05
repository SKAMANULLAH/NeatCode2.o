const mongoose = require("mongoose");

const { Schema } = mongoose;

const submissionSchema = new Schema(
  {
    problemId: {
      type: Schema.Types.ObjectId,
      ref: "problem",
      required: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    code: {
      type: String,
      required: true,
    },

    language: {
      type: String,
      required: true,
      enum: ["nodejs", "cpp17", "java"],
    },



    
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "wrongAnswer",
        "compilationError",
        "runtimeError",
        "timeLimitExceeded",
      ],
      default: "pending",
    },

    time: {
      type: Number,
      default: 0,
    },

    memory: {
      type: Number,
      default: 0,
    },

    errorMessage: {
      type: String,
      default: "",
    },

    testCasesPassed: {
      type: Number,
      default: 0,
    },

    testCasesTotal: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

submissionSchema.index({userId:1,problemId:1});

const submissionModel = mongoose.model("submission", submissionSchema);

module.exports = submissionModel;
