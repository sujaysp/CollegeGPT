const express = require("express");

const {
  sendMessage,
  regenerateMessage,
} = require("../controllers/chat.controller");

const router = express.Router();

router.post(
  "/message",
  sendMessage
);

router.post(
  "/regenerate",
  regenerateMessage
);

module.exports = router;