// Channel Routes
const express = require("express");
const router = express.Router();
const {
  createNewChannel,
  getMyChannels,
  getChannelById,
  joinChannel,
  getMembers,
  updateChannelDetails,
  kickMember,
  deleteChannelById,
} = require("../controllers/channelController");
const {
  getChannelMessagesHistory,
} = require("../controllers/messageController");
const { authenticateToken } = require("../middleware/auth");

// All channel routes require authentication
router.use(authenticateToken);

// Create new channel
router.post("/", createNewChannel);

// Join channel by admin code
router.post("/join", joinChannel);

// Get all user's channels
router.get("/", getMyChannels);

// Get specific channel
router.get("/:id", getChannelById);

// Update channel details (admin only)
router.patch("/:id", updateChannelDetails);

// Delete channel (creator only)
router.delete("/:id", deleteChannelById);

// Get channel members
router.get("/:id/members", getMembers);

// Remove member from channel (admin only)
router.delete("/:id/members/:userId", kickMember);

// Get channel messages history
router.get("/:id/messages", getChannelMessagesHistory);

module.exports = router;
