const express = require("express");
const router = express.Router();
const {
  getDirectMessagesHistory,
  getConversations,
} = require("../controllers/messageController");
const { authenticateToken } = require("../middleware/auth");

// All message routes require authentication
router.use(authenticateToken);

// Get all conversations
router.get("/conversations", getConversations);

// Get direct messages with specific user
router.get("/:userId/messages", getDirectMessagesHistory);

module.exports = router;
