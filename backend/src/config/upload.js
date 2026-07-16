import multer from "multer";

// 5MB per file. MongoDB's 16MB document limit is the hard ceiling for a single
// Attachment document (metadata + Buffer).
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});
