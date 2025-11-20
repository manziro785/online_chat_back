const { query } = require("../config/db");

/**
 * Create new channel
 */
const createChannel = async (
  name,
  description,
  avatarUrl,
  adminCode,
  creatorId
) => {
  const result = await query(
    `INSERT INTO channels (name, description, avatar_url, admin_code, creator_id) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING *`,
    [name, description, avatarUrl, adminCode, creatorId]
  );
  return result.rows[0];
};

/**
 * Add user to channel as member
 */
const addChannelMember = async (channelId, userId, role = "member") => {
  const result = await query(
    `INSERT INTO channel_members (channel_id, user_id, role) 
     VALUES ($1, $2, $3) 
     RETURNING *`,
    [channelId, userId, role]
  );
  return result.rows[0];
};

/**
 * Find channel by ID
 */
const findChannelById = async (channelId) => {
  const result = await query("SELECT * FROM channels WHERE id = $1", [
    channelId,
  ]);
  return result.rows[0];
};

/**
 * Find channel by admin code
 */
const findChannelByAdminCode = async (adminCode) => {
  const result = await query("SELECT * FROM channels WHERE admin_code = $1", [
    adminCode,
  ]);
  return result.rows[0];
};

/**
 * Get all channels for a user
 */
const getUserChannels = async (userId) => {
  const result = await query(
    `SELECT c.*, cm.role, cm.joined_at,
            u.nickname as creator_nickname
     FROM channels c
     JOIN channel_members cm ON c.id = cm.channel_id
     LEFT JOIN users u ON c.creator_id = u.id
     WHERE cm.user_id = $1
     ORDER BY cm.joined_at DESC`,
    [userId]
  );
  return result.rows;
};

/**
 * Get channel members
 */
const getChannelMembers = async (channelId) => {
  const result = await query(
    `SELECT u.id, u.nickname, u.avatar_url, u.last_seen, cm.role, cm.joined_at
     FROM users u
     JOIN channel_members cm ON u.id = cm.user_id
     WHERE cm.channel_id = $1
     ORDER BY cm.joined_at ASC`,
    [channelId]
  );
  return result.rows;
};

/**
 * Check if user is member of channel
 */
const isChannelMember = async (channelId, userId) => {
  const result = await query(
    "SELECT * FROM channel_members WHERE channel_id = $1 AND user_id = $2",
    [channelId, userId]
  );
  return result.rows.length > 0;
};

/**
 * Check if user is admin of channel
 */
const isChannelAdmin = async (channelId, userId) => {
  const result = await query(
    `SELECT * FROM channel_members 
     WHERE channel_id = $1 AND user_id = $2 AND role = 'admin'`,
    [channelId, userId]
  );
  return result.rows.length > 0;
};

/**
 * Remove user from channel
 */
const removeChannelMember = async (channelId, userId) => {
  const result = await query(
    "DELETE FROM channel_members WHERE channel_id = $1 AND user_id = $2 RETURNING *",
    [channelId, userId]
  );
  return result.rows[0];
};

/**
 * Update channel details
 */
const updateChannel = async (channelId, updates) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (updates.name) {
    fields.push(`name = $${paramCount++}`);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramCount++}`);
    values.push(updates.description);
  }
  if (updates.avatar_url !== undefined) {
    fields.push(`avatar_url = $${paramCount++}`);
    values.push(updates.avatar_url);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  values.push(channelId);
  const result = await query(
    `UPDATE channels SET ${fields.join(
      ", "
    )} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0];
};

/**
 * Delete channel
 */
const deleteChannel = async (channelId) => {
  const result = await query("DELETE FROM channels WHERE id = $1 RETURNING *", [
    channelId,
  ]);
  return result.rows[0];
};

module.exports = {
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
};
