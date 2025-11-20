/**
 * Error handling middleware
 * Must be registered last in middleware chain
 */
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Default
  let status = err.status || 500;
  let message = err.message || "Internal server error";

  if (err.code === "23505") {
    status = 409;
    message = "Resource already exists";
  } else if (err.code === "23503") {
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
