import multer from "multer";

// 5MB per file. MongoDB's 16MB document limit is the hard ceiling for a single
// Attachment document (metadata + Buffer).
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_AVATAR_SIZE,
  },
  fileFilter(_req, file, cb) {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    const err = new Error("Only JPEG, PNG, WebP, and GIF images are allowed");
    err.status = 400;
    cb(err);
  },
});
