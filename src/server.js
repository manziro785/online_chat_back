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

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const channelRoutes = require("./routes/channels");
const messageRoutes = require("./routes/messages");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: "*", // Allow all origins
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

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

initializeSocket(io);

app.use(notFoundHandler);

app.use(errorHandler);

// Auto-run database migrations on startup
const runMigrations = async () => {
  try {
    const sqlPath = path.join(__dirname, "../database.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    await pool.query(sql);
    console.log("Database completed");
  } catch (error) {
    if (error.code === "42P07") {
      console.log("Tables already exist");
    } else {
      console.error(" Migration error:", error.message);
    }
  }
};

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  try {
    await pool.query("SELECT NOW()");
    console.log("✅ Database connected successfully");

    await runMigrations();

    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.io ready for connections`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
});

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
