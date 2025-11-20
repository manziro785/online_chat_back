// Channel Controller
const {
  createChannel,
  addChannelMember,
  findChannelById,
  findChannelByAdminCode,
  getUserChannels,
  getChannelMembers,
  isChannelMember,
  isChannelAdmin,
  removeChannelMember,
  updateChannel,
  deleteChannel,
} = require("../models/channelModel");
const { generateAdminCode } = require("../utils/helpers");

/**
 * Create new channel
 * POST /api/channels
 */
const createNewChannel = async (req, res, next) => {
  try {
    const { name, description, avatar_url } = req.body;
    const creatorId = req.user.id;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Channel name is required" });
    }

    if (name.length > 100) {
      return res
        .status(400)
        .json({ error: "Channel name must be less than 100 characters" });
    }

    // Generate unique admin code
    let adminCode;
    let isUnique = false;
    while (!isUnique) {
      adminCode = generateAdminCode();
      const existing = await findChannelByAdminCode(adminCode);
      if (!existing) isUnique = true;
    }

    // Create channel
    const channel = await createChannel(
      name.trim(),
      description?.trim() || null,
      avatar_url || null,
      adminCode,
      creatorId
    );

    // Add creator as admin member
    await addChannelMember(channel.id, creatorId, "admin");

    res.status(201).json({
      message: "Channel created successfully",
      channel,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all channels for current user
 * GET /api/channels
 */
const getMyChannels = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const channels = await getUserChannels(userId);

    res.json({
      channels,
      count: channels.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get channel by ID
 * GET /api/channels/:id
 */
const getChannelById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const channel = await findChannelById(id);
    if (!channel) {
      return res.status(404).json({ error: "Channel not found" });
    }

    // Check if user is member
    const isMember = await isChannelMember(id, userId);
    if (!isMember) {
      return res
        .status(403)
        .json({ error: "You are not a member of this channel" });
    }

    res.json({ channel });
  } catch (error) {
    next(error);
  }
};

/**
 * Join channel by admin code
 * POST /api/channels/join
 */
const joinChannel = async (req, res, next) => {
  try {
    const { admin_code } = req.body;
    const userId = req.user.id;

    if (!admin_code) {
      return res.status(400).json({ error: "Admin code is required" });
    }

    // Find channel by code
    const channel = await findChannelByAdminCode(admin_code.toUpperCase());
    if (!channel) {
      return res.status(404).json({ error: "Invalid admin code" });
    }

    // Check if already member
    const alreadyMember = await isChannelMember(channel.id, userId);
    if (alreadyMember) {
      return res
        .status(409)
        .json({ error: "You are already a member of this channel" });
    }

    // Add user as member
    await addChannelMember(channel.id, userId, "member");

    res.json({
      message: "Successfully joined channel",
      channel,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get channel members
 * GET /api/channels/:id/members
 */
const getMembers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is member
    const isMember = await isChannelMember(id, userId);
    if (!isMember) {
      return res
        .status(403)
        .json({ error: "You are not a member of this channel" });
    }

    const members = await getChannelMembers(id);

    res.json({
      members,
      count: members.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update channel details (admin only)
 * PATCH /api/channels/:id
 */
const updateChannelDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, avatar_url } = req.body;
    const userId = req.user.id;

    // Check if user is admin
    const isAdmin = await isChannelAdmin(id, userId);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: "Only admins can update channel details" });
    }

    // Build updates object
    const updates = {};
    if (name) updates.name = name.trim();
    if (description !== undefined)
      updates.description = description?.trim() || null;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url || null;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const updatedChannel = await updateChannel(id, updates);

    res.json({
      message: "Channel updated successfully",
      channel: updatedChannel,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove user from channel (admin only)
 * DELETE /api/channels/:id/members/:userId
 */
const kickMember = async (req, res, next) => {
  try {
    const { id, userId: targetUserId } = req.params;
    const adminUserId = req.user.id;

    // Check if requester is admin
    const isAdmin = await isChannelAdmin(id, adminUserId);
    if (!isAdmin) {
      return res.status(403).json({ error: "Only admins can remove members" });
    }

    // Check if target user is channel creator
    const channel = await findChannelById(id);
    if (channel.creator_id === targetUserId) {
      return res.status(403).json({ error: "Cannot remove channel creator" });
    }

    // Remove member
    const removed = await removeChannelMember(id, targetUserId);
    if (!removed) {
      return res
        .status(404)
        .json({ error: "User is not a member of this channel" });
    }

    res.json({
      message: "User removed from channel successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete channel (creator only)
 * DELETE /api/channels/:id
 */
const deleteChannelById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is creator
    const channel = await findChannelById(id);
    if (!channel) {
      return res.status(404).json({ error: "Channel not found" });
    }

    if (channel.creator_id !== userId) {
      return res
        .status(403)
        .json({ error: "Only channel creator can delete the channel" });
    }

    await deleteChannel(id);

    res.json({
      message: "Channel deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add member to channel by user ID (admin only)
 * POST /api/channels/:id/members
 */
const addMemberToChannel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    const adminUserId = req.user.id;

    // Validation
    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check if requester is admin
    const isAdmin = await isChannelAdmin(id, adminUserId);
    if (!isAdmin) {
      return res.status(403).json({ error: "Only admins can add members" });
    }

    // Check if target user already a member
    const alreadyMember = await isChannelMember(id, user_id);
    if (alreadyMember) {
      return res
        .status(409)
        .json({ error: "User is already a member of this channel" });
    }

    // Add user as member
    await addChannelMember(id, user_id, "member");

    // Get updated member list
    const members = await getChannelMembers(id);

    res.json({
      message: "Member added successfully",
      members,
      count: members.length,
    });
  } catch (error) {
    // Handle case where user doesn't exist
    if (error.code === "23503") {
      return res.status(404).json({ error: "User not found" });
    }
    next(error);
  }
};

module.exports = {
  createNewChannel,
  getMyChannels,
  getChannelById,
  joinChannel,
  getMembers,
  updateChannelDetails,
  kickMember,
  deleteChannelById,
  addMemberToChannel,
};
