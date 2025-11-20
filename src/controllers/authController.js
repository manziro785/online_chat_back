const bcrypt = require("bcryptjs");
const { generateToken } = require("../middleware/auth");
const {
  createUser,
  findUserByEmail,
  findUserByNickname,
} = require("../models/userModel");
const {
  isValidEmail,
  isValidNickname,
  formatUser,
} = require("../utils/helpers");

/**
 * Register new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { email, nickname, password } = req.body;

    if (!email || !nickname || !password) {
      return res
        .status(400)
        .json({ error: "Email, nickname and password are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (!isValidNickname(nickname)) {
      return res.status(400).json({
        error:
          "Nickname must be 3-50 characters long and contain only letters, numbers and underscores",
      });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const existingNickname = await findUserByNickname(nickname);
    if (existingNickname) {
      return res.status(409).json({ error: "Nickname already taken" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser(email, nickname, passwordHash);
    const token = generateToken(user.id);
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = generateToken(user.id);

    res.json({
      message: "Login successful",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user info
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res, next) => {
  try {
    res.json({
      user: formatUser(req.user),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
};
