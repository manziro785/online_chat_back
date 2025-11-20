const express = require("express");
const router = express.Router();
const {
  searchUsersByNickname,
  getUserById,
  updateCurrentUser,
} = require("../controllers/userController");
const { authenticateToken } = require("../middleware/auth");

// All user routes require authentication
router.use(authenticateToken);

// Search users
router.get("/search", searchUsersByNickname);

// Update current user profile
router.patch("/me", updateCurrentUser);

// Get user by ID
router.get("/:id", getUserById);

module.exports = router;
