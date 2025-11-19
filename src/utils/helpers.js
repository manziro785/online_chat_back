/**
 Generate random admin code for channels
 Format: #ABC123 (uppercase letters + numbers)
 */
const generateAdminCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "#";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate nickname (3-50 chars, alphanumeric + underscore)
 */
const isValidNickname = (nickname) => {
  const nicknameRegex = /^[a-zA-Z0-9_]{3,50}$/;
  return nicknameRegex.test(nickname);
};

/**
 * Format user object (remove sensitive data)
 */
const formatUser = (user) => {
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Format message object with sender info
 */
const formatMessage = (message, sender) => {
  return {
    id: message.id,
    content: message.content,
    channelId: message.channel_id,
    receiverId: message.receiver_id,
    isDirectMessage: message.is_direct_message,
    createdAt: message.created_at,
    sender: sender ? formatUser(sender) : null,
  };
};

/**
 * Calculate pagination offset
 */
const getPaginationOffset = (page = 1, limit = 50) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 50;
  return {
    limit: limitNum,
    offset: (pageNum - 1) * limitNum,
  };
};

module.exports = {
  generateAdminCode,
  isValidEmail,
  isValidNickname,
  formatUser,
  formatMessage,
  getPaginationOffset,
};
