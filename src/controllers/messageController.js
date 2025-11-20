const {
  getChannelMessages,
  getDirectMessages,
  getUserConversations,
} = require("../models/messageModel");
const { isChannelMember } = require("../models/channelModel");
const { getPaginationOffset } = require("../utils/helpers");

/**
 * Get channel messages history
 * GET /api/channels/:id/messages?page=1&limit=50
 */
const getChannelMessagesHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    const isMember = await isChannelMember(id, userId);
    if (!isMember) {
      return res
        .status(403)
        .json({ error: "You are not a member of this channel" });
    }
    const { limit: limitNum, offset } = getPaginationOffset(page, limit);
    const messages = await getChannelMessages(id, limitNum, offset);

    res.json({
      messages,
      count: messages.length,
      page: parseInt(page),
      limit: limitNum,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get direct messages history with a user
 * GET /api/direct/:userId/messages?page=1&limit=50
 */
const getDirectMessagesHistory = async (req, res, next) => {
  try {
    const { userId: otherUserId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const currentUserId = req.user.id;
    const { limit: limitNum, offset } = getPaginationOffset(page, limit);
    const messages = await getDirectMessages(
      currentUserId,
      otherUserId,
      limitNum,
      offset
    );

    res.json({
      messages,
      count: messages.length,
      page: parseInt(page),
      limit: limitNum,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all conversations for current user
 * GET /api/direct/conversations
 */
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const conversations = await getUserConversations(userId);

    res.json({
      conversations,
      count: conversations.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChannelMessagesHistory,
  getDirectMessagesHistory,
  getConversations,
};
