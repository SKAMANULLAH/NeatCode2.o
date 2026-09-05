const topicModel = require("../models/topicModel");

// Create Topic
const createTopic = async (req, res) => {
  try {
    const { title, subtopic } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Topic title is required",
      });
    }

    const existingTopic = await topicModel.findOne({ title });

    if (existingTopic) {
      return res.status(409).json({
        message: "Topic already exists",
      });
    }

    const topic = await topicModel.create({
      title,
      subtopic: subtopic || [],
    });

    return res.status(201).json({
      message: "Topic created successfully",
      topic,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Can not create topic",
      error: err.message,
    });
  }
};

// Update Topic
const updateTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtopic } = req.body;

    const topic = await topicModel.findById(id);

    if (!topic) {
      return res.status(404).json({
        message: "Sorry, the topic is unavailable",
      });
    }

    // Update only the fields that were provided
    if (title !== undefined) {
      topic.title = title;
    }

    if (subtopic !== undefined) {
      topic.subtopic = subtopic;
    }

    const updatedTopic = await topic.save();

    return res.status(200).json({
      message: "Topic updated successfully",
      topic: updatedTopic,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Can not update topic",
      error: err.message,
    });
  }
};

// Fetch single topic
const fetchTopic = async (req, res) => {
  try {
    const { id } = req.params;

    const topic = await topicModel.findById(id);

    if (!topic) {
      return res.status(404).json({
        message: "Sorry the topic is unavailable",
      });
    }

    return res.status(200).json(topic);
  } catch (err) {
    return res.status(500).json({
      message: "Can not fetch that topic",
    });
  }
};

// Fetch all topics
const fetchTopicAll = async (req, res) => {
  try {
    const topic = await topicModel.find().select("title subtopic._id subtopic.title");

    if (topic.length === 0) {
      return res.status(404).json({
        message: "Sorry the topics are unavailable",
      });
    }

    return res.status(200).json(topic);
  } catch (err) {
    return res.status(500).json({
      message: "Can not fetch that topic",
    });
  }
};

module.exports = {
  createTopic,
  updateTopic,
  fetchTopic,
  fetchTopicAll,
};
