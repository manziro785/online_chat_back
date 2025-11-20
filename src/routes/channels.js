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
  addMemberToChannel,
} = require("../controllers/channelController");
const {
  getChannelMessagesHistory,
} = require("../controllers/messageController");
const { authenticateToken } = require("../middleware/auth");

router.use(authenticateToken);

// Create channel
router.post("/", createNewChannel);

// Join channel
router.post("/join", joinChannel);

// Get all users
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

// Add new members
router.post("/:id/members", addMemberToChannel);

module.exports = router;
