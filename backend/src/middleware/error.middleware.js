import multer from "multer";

export function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      const isAvatarRoute = req.originalUrl?.includes("/auth/avatar");
      return res.status(400).json({
        message: isAvatarRoute
          ? "Image too large. Max size is 2MB."
          : "File too large. Max size is 5MB.",
      });
    }

    return res.status(400).json({
      message: err.message || "File upload failed",
    });
  }

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
