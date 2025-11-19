const {
  findUserById,
  searchUsers,
  updateUserProfile,
} = require("../models/userModel");
const { formatUser } = require("../utils/helpers");

const searchUsersByNickname = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const users = await searchUsers(query.trim(), 20);

    res.json({
      users: users.map(formatUser),
      count: users.length,
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await findUserById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const updateCurrentUser = async (req, res, next) => {
  try {
    const { nickname, avatar_url } = req.body;
    const userId = req.user.id;

    const updates = {};
    if (nickname) updates.nickname = nickname;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const updatedUser = await updateUserProfile(userId, updates);

    res.json({
      message: "Profile updated successfully",
      user: formatUser(updatedUser),
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Nickname already taken" });
    }
    next(error);
  }
};

module.exports = {
  searchUsersByNickname,
  getUserById,
  updateCurrentUser,
};
