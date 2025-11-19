const { query } = require("../config/db");

const createChannelMessage = async (channelId, senderId, content) => {
  const result = await query(
    `INSERT INTO messages (channel_id, sender_id, content, is_direct_message) 
     VALUES ($1, $2, $3, false) 
     RETURNING *`,
    [channelId, senderId, content]
  );
  return result.rows[0];
};

const createDirectMessage = async (senderId, receiverId, content) => {
  const result = await query(
    `INSERT INTO messages (sender_id, receiver_id, content, is_direct_message) 
     VALUES ($1, $2, $3, true) 
     RETURNING *`,
    [senderId, receiverId, content]
  );
  return result.rows[0];
};

const getChannelMessages = async (channelId, limit = 50, offset = 0) => {
  const result = await query(
    `SELECT m.*, 
            u.nickname as sender_nickname, 
            u.avatar_url as sender_avatar
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.channel_id = $1 AND m.is_direct_message = false
     ORDER BY m.created_at DESC
     LIMIT $2 OFFSET $3`,
    [channelId, limit, offset]
  );
  return result.rows.reverse();
};

const getDirectMessages = async (userId1, userId2, limit = 50, offset = 0) => {
  const result = await query(
    `SELECT m.*, 
            u.nickname as sender_nickname, 
            u.avatar_url as sender_avatar
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.is_direct_message = true
       AND ((m.sender_id = $1 AND m.receiver_id = $2) 
         OR (m.sender_id = $2 AND m.receiver_id = $1))
     ORDER BY m.created_at DESC
     LIMIT $3 OFFSET $4`,
    [userId1, userId2, limit, offset]
  );
  return result.rows.reverse();
};

const getUserConversations = async (userId) => {
  const result = await query(
    `SELECT DISTINCT 
       CASE 
         WHEN m.sender_id = $1 THEN m.receiver_id 
         ELSE m.sender_id 
       END as user_id,
       u.nickname, 
       u.avatar_url, 
       u.last_seen,
       MAX(m.created_at) as last_message_at
     FROM messages m
     JOIN users u ON (
       CASE 
         WHEN m.sender_id = $1 THEN m.receiver_id 
         ELSE m.sender_id 
       END = u.id
     )
     WHERE m.is_direct_message = true 
       AND (m.sender_id = $1 OR m.receiver_id = $1)
     GROUP BY user_id, u.nickname, u.avatar_url, u.last_seen
     ORDER BY last_message_at DESC`,
    [userId]
  );
  return result.rows;
};

const findMessageById = async (messageId) => {
  const result = await query(
    `SELECT m.*, 
            u.nickname as sender_nickname, 
            u.avatar_url as sender_avatar
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.id = $1`,
    [messageId]
  );
  return result.rows[0];
};

const deleteMessage = async (messageId) => {
  const result = await query("DELETE FROM messages WHERE id = $1 RETURNING *", [
    messageId,
  ]);
  return result.rows[0];
};

module.exports = {
  createChannelMessage,
  createDirectMessage,
  getChannelMessages,
  getDirectMessages,
  getUserConversations,
  findMessageById,
  deleteMessage,
};
