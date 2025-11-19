// Main server file
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { pool } = require("./config/db");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const initializeSocket = require("./sockets/chatSocket");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const channelRoutes = require("./routes/channels");
const messageRoutes = require("./routes/messages");

// Initialize express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: "*", // Allow all origins for development
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (simple)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check route
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Chat API is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/direct", messageRoutes);

// Initialize Socket.io
initializeSocket(io);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Auto-run database migrations on startup
const runMigrations = async () => {
  try {
    const sqlPath = path.join(__dirname, "../database.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    await pool.query(sql);
    console.log("✅ Database migrations completed");
  } catch (error) {
    if (error.code === "42P07") {
      console.log("⚠️ Tables already exist, skipping migrations");
    } else {
      console.error("❌ Migration error:", error.message);
    }
  }
};

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  try {
    // Test database connection
    await pool.query("SELECT NOW()");
    console.log("✅ Database connected successfully");

    // Run migrations
    await runMigrations();

    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.io ready for connections`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(async () => {
    await pool.end();
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully...");
  server.close(async () => {
    await pool.end();
    console.log("Server closed");
    process.exit(0);
  });
});
