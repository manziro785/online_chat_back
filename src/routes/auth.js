const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getCurrentUser,
} = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticateToken, getCurrentUser);

module.exports = router;
