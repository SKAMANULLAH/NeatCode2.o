const mongoose = require("mongoose");
const { Schema } = mongoose;

const problemSchema = new Schema(
  {
    title: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    tags: {
      type: String,
      required: true,
      enum: [
        "array",
        "string",
        "linkedList",
        "stack",
        "queue",
        "hashing",
        "tree",
        "heap",
        "graph",
        "greedy",
        "dp",
        "recursion",
        "backtracking",
        "binarySearch",
        "bitManipulation",
      ],
    },
    visibleTestCases: [
      {
        input: {
          type: String,
          required: true,
        },
        output: {
          type: String,
          required: true,
        },
        explanation: { type: String, required: true },
      },
    ],
    invisibleTestCases: [
      {
        input: {
          type: String,
          required: true,
        },
        output: {
          type: String,
          required: true,
        },
      },
    ],

    startCode: [
      {
        language: { type: String, required: true },
        initialCode: { type: String, required: true },
      },
    ],
    referenceSolution: [
      {
        language: { type: String, required: true },
        completeCode: { type: String, required: true },
      },
    ],

    problemCreator: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    videoUrl: { type: String },
  },
  { timestamps: true },
);

const problemModel = mongoose.model("problem", problemSchema);

module.exports = problemModel;
