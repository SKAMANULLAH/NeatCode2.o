const mongoose = require("mongoose");

const { Schema } = mongoose;

const quizSchema = new Schema({
  title: {
    type: String,
    unique: true,
    required: true,
  },

  question: {
    type: [
      {
        statement: { type: String },

        option: {
          type: [
            {
              choice: { type: String },
            },
          ],
        },

        correct: {
          type: String,
          enum: ["a", "b", "c", "d"],
        },
        topicId: {
          type: Schema.Types.ObjectId,
          ref: "topic",
        },
        subtopicId: {
          type: Schema.Types.ObjectId,
        },
      },
    ],
  },
});

const quizModel = mongoose.model("quiz", quizSchema);

module.exports = quizModel;
