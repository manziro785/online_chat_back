// Socket.io Chat Logic
const jwt = require("jsonwebtoken");
const { query } = require("../config/db");
const {
  createChannelMessage,
  createDirectMessage,
} = require("../models/messageModel");
const { isChannelMember } = require("../models/channelModel");
const { updateLastSeen, findUserById } = require("../models/userModel");

// Store connected users: userId -> socketId
const connectedUsers = new Map();
const onlineUsers = new Map(); // userId -> socket.id

const initializeSocket = (io) => {
  // Authenticate socket connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      const user = await findUserById(decoded.userId);
      if (!user) {
        return next(new Error("User not found"));
      }

      // Attach user to socket
      socket.userId = user.id;
      socket.userNickname = user.nickname;

      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.auth.userId; // или берёшь из токена
    onlineUsers.set(userId, socket.id);

    // Уведомить всех, что этот пользователь онлайн
    io.emit("user-online", { userId });

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      io.emit("user-offline", { userId });
    });
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    console.log(`✅ User connected: ${socket.userNickname} (${userId})`);

    // Store connected user
    connectedUsers.set(userId, socket.id);

    // Update user's last_seen and broadcast online status
    await updateLastSeen(userId);
    io.emit("user_status", { userId, status: "online" });

    // Join user's channels automatically
    try {
      const result = await query(
        "SELECT channel_id FROM channel_members WHERE user_id = $1",
        [userId]
      );

      result.rows.forEach((row) => {
        socket.join(row.channel_id);
        console.log(
          `User ${socket.userNickname} joined room: ${row.channel_id}`
        );
      });
    } catch (error) {
      console.error("Error joining channels:", error);
    }

    // Handle joining a channel room
    socket.on("join_channel", async (data) => {
      try {
        const { channelId } = data;

        // Verify user is member
        const isMember = await isChannelMember(channelId, userId);
        if (!isMember) {
          socket.emit("error", {
            message: "You are not a member of this channel",
          });
          return;
        }

        socket.join(channelId);
        console.log(`User ${socket.userNickname} joined channel: ${channelId}`);

        // Notify channel members
        socket.to(channelId).emit("user_joined", {
          userId,
          nickname: socket.userNickname,
          channelId,
        });
      } catch (error) {
        console.error("Error joining channel:", error);
        socket.emit("error", { message: "Failed to join channel" });
      }
    });

    // Handle leaving a channel room
    socket.on("leave_channel", (data) => {
      try {
        const { channelId } = data;
        socket.leave(channelId);
        console.log(`User ${socket.userNickname} left channel: ${channelId}`);

        // Notify channel members
        socket.to(channelId).emit("user_left", {
          userId,
          nickname: socket.userNickname,
          channelId,
        });
      } catch (error) {
        console.error("Error leaving channel:", error);
      }
    });

    // Handle sending channel message
    socket.on("send_message", async (data) => {
      try {
        const { channelId, content } = data;

        if (!content || content.trim().length === 0) {
          socket.emit("error", { message: "Message content cannot be empty" });
          return;
        }

        // Verify user is member
        const isMember = await isChannelMember(channelId, userId);
        if (!isMember) {
          socket.emit("error", {
            message: "You are not a member of this channel",
          });
          return;
        }

        // Save message to database
        const message = await createChannelMessage(
          channelId,
          userId,
          content.trim()
        );

        // Prepare message payload
        const messagePayload = {
          id: message.id,
          channelId: message.channel_id,
          senderId: userId,
          senderNickname: socket.userNickname,
          content: message.content,
          createdAt: message.created_at,
          isDirectMessage: false,
        };

        io.to(channelId).emit("new_message", messagePayload);

        console.log(
          `Message sent in channel ${channelId} by ${socket.userNickname}`
        );
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle sending direct message
    socket.on("send_direct_message", async (data) => {
      try {
        const { receiverId, content } = data;

        if (!content || content.trim().length === 0) {
          socket.emit("error", { message: "Message content cannot be empty" });
          return;
        }

        // Check if receiver exists
        const receiver = await findUserById(receiverId);
        if (!receiver) {
          socket.emit("error", { message: "Recipient not found" });
          return;
        }

        // Save message to database
        const message = await createDirectMessage(
          userId,
          receiverId,
          content.trim()
        );

        // Prepare message payload
        const messagePayload = {
          id: message.id,
          senderId: userId,
          senderNickname: socket.userNickname,
          receiverId: receiverId,
          content: message.content,
          createdAt: message.created_at,
          isDirectMessage: true,
        };

        // Send to receiver if online
        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("new_direct_message", messagePayload);
        }

        // Send confirmation to sender
        socket.emit("new_direct_message", messagePayload);

        console.log(
          `Direct message sent from ${socket.userNickname} to ${receiver.nickname}`
        );
      } catch (error) {
        console.error("Error sending direct message:", error);
        socket.emit("error", { message: "Failed to send direct message" });
      }
    });

    // Handle typing indicator for channels
    socket.on("typing", (data) => {
      const { channelId } = data;
      socket.to(channelId).emit("typing_indicator", {
        userId,
        nickname: socket.userNickname,
        channelId,
      });
    });

    // Handle stop typing
    socket.on("stop_typing", (data) => {
      const { channelId } = data;
      socket.to(channelId).emit("stop_typing_indicator", {
        userId,
        channelId,
      });
    });

    // Handle user kicked from channel
    socket.on("user_kicked", (data) => {
      const { channelId, kickedUserId } = data;

      // Notify kicked user
      const kickedSocketId = connectedUsers.get(kickedUserId);
      if (kickedSocketId) {
        io.to(kickedSocketId).emit("kicked_from_channel", { channelId });
      }

      // Notify channel
      socket
        .to(channelId)
        .emit("user_removed", { userId: kickedUserId, channelId });
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      console.log(`❌ User disconnected: ${socket.userNickname} (${userId})`);

      // Remove from connected users
      connectedUsers.delete(userId);

      // Update last_seen and broadcast offline status
      await updateLastSeen(userId);
      io.emit("user_status", { userId, status: "offline" });
    });
  });

  console.log("🔌 Socket.io initialized");
};

module.exports = initializeSocket;
