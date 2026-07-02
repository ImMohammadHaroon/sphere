export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || "Internal server error";

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV === "development" && status >= 500
      ? { stack: err.stack }
      : {}),
  });
}
