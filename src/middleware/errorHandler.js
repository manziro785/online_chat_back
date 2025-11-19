// Global error handler middleware

/**
 * Error handling middleware
 * Must be registered last in middleware chain
 */
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Default error
  let status = err.status || 500;
  let message = err.message || "Internal server error";

  // Handle specific error types
  if (err.code === "23505") {
    // PostgreSQL unique violation
    status = 409;
    message = "Resource already exists";
  } else if (err.code === "23503") {
    // PostgreSQL foreign key violation
    status = 404;
    message = "Referenced resource not found";
  } else if (err.name === "ValidationError") {
    status = 400;
    message = err.message;
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

/**
 * 404 handler for undefined routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({ error: "Route not found" });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
