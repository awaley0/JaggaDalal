// Global error handler
export const errorHandler = (err, req, res, next) => {
  console.error("❌ Error Details:", {
    message: err.message,
    stack: err.stack,
    status: err.status || 500,
  });

  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === "development" && {
        stack: err.stack,
        details: err,
      }),
    },
  });
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Custom error class
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.status = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
