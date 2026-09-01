const express = require("express");

const {
  getConversations,
  getConversation,
  renameConversation,
  deleteConversation,
} = require("../controllers/conversation.controller");

const router = express.Router();

router.get("/", getConversations);

router.get("/:id", getConversation);

router.patch("/:id", renameConversation);

router.delete("/:id", deleteConversation);

module.exports = router;