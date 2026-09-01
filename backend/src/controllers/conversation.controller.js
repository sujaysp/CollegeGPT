const jwt = require("jsonwebtoken");

const Conversation = require("../models/conversation.model");

const getUserFromToken = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET
    );
  } catch (error) {
    return null;
  }
};

const getConversations = async (req, res) => {
  try {
    const decoded = getUserFromToken(req);

    if (!decoded) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const conversations =
      await Conversation.find({
        user: decoded.userId,
      })
        .select("_id title createdAt updatedAt")
        .sort({ updatedAt: -1 });

    return res.status(200).json({
      conversations,
    });
  } catch (error) {
    console.error(
      "Get conversations error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Something went wrong while loading conversations",
    });
  }
};

const getConversation = async (req, res) => {
  try {
    const decoded = getUserFromToken(req);

    if (!decoded) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const conversation =
      await Conversation.findOne({
        _id: req.params.id,
        user: decoded.userId,
      });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    return res.status(200).json({
      conversation,
    });
  } catch (error) {
    console.error(
      "Get conversation error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Something went wrong while loading the conversation",
    });
  }
};

const renameConversation = async (req, res) => {
  try {
    const decoded = getUserFromToken(req);

    if (!decoded) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Conversation title is required",
      });
    }

    const conversation =
      await Conversation.findOne({
        _id: req.params.id,
        user: decoded.userId,
      });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    conversation.title =
      title.trim().slice(0, 100);

    await conversation.save();

    return res.status(200).json({
      message: "Conversation renamed successfully",

      conversation: {
        _id: conversation._id,
        title: conversation.title,
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Rename conversation error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Something went wrong while renaming the conversation",
    });
  }
};

const deleteConversation = async (req, res) => {
  try {
    const decoded = getUserFromToken(req);

    if (!decoded) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const conversation =
      await Conversation.findOneAndDelete({
        _id: req.params.id,
        user: decoded.userId,
      });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    return res.status(200).json({
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete conversation error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Something went wrong while deleting the conversation",
    });
  }
};

module.exports = {
  getConversations,
  getConversation,
  renameConversation,
  deleteConversation,
};