// User Model - Database queries for users
const { query } = require("../config/db");

/**
 * Create new user
 */
const createUser = async (email, nickname, passwordHash) => {
  const result = await query(
    "INSERT INTO users (email, nickname, password_hash) VALUES ($1, $2, $3) RETURNING *",
    [email, nickname, passwordHash]
  );
  return result.rows[0];
};

/**
 * Find user by email
 */
const findUserByEmail = async (email) => {
  const result = await query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0];
};

/**
 * Find user by nickname
 */
const findUserByNickname = async (nickname) => {
  const result = await query("SELECT * FROM users WHERE nickname = $1", [
    nickname,
  ]);
  return result.rows[0];
};

/**
 * Find user by ID
 */
const findUserById = async (userId) => {
  const result = await query(
    "SELECT id, email, nickname, avatar_url, created_at, last_seen FROM users WHERE id = $1",
    [userId]
  );
  return result.rows[0];
};

/**
 * Search users by nickname (partial match)
 */
const searchUsers = async (searchQuery, limit = 10) => {
  const result = await query(
    `SELECT id, email, nickname, avatar_url, last_seen 
     FROM users 
     WHERE nickname ILIKE $1 
     ORDER BY nickname 
     LIMIT $2`,
    [`%${searchQuery}%`, limit]
  );
  return result.rows;
};

/**
 * Update user's last seen timestamp
 */
const updateLastSeen = async (userId) => {
  const result = await query(
    "UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = $1 RETURNING last_seen",
    [userId]
  );
  return result.rows[0];
};

/**
 * Update user profile (avatar, nickname)
 */
const updateUserProfile = async (userId, updates) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (updates.nickname) {
    fields.push(`nickname = $${paramCount++}`);
    values.push(updates.nickname);
  }
  if (updates.avatar_url !== undefined) {
    fields.push(`avatar_url = $${paramCount++}`);
    values.push(updates.avatar_url);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  values.push(userId);
  const result = await query(
    `UPDATE users SET ${fields.join(
      ", "
    )} WHERE id = $${paramCount} RETURNING id, email, nickname, avatar_url, created_at, last_seen`,
    values
  );
  return result.rows[0];
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserByNickname,
  findUserById,
  searchUsers,
  updateLastSeen,
  updateUserProfile,
};
