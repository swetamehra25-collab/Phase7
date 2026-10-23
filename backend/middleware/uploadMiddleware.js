import multer from "multer";
import path from "path";

import cloudinary from "../config/cloudinary.js";

const allowedExtensions = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".pdf",
  ".txt",
  ".md",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".html",
  ".css",
  ".py",
  ".java",
  ".c",
  ".cpp",
  ".sql",
  ".xml",
  ".yml",
  ".yaml",
  ".csv"
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      return callback(new Error("This file type is not allowed."));
    }

    callback(null, true);
  }
});

export const handleSingleFileUpload = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (error) {
      const isSizeLimit =
        error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE";

      return res.status(isSizeLimit ? 413 : 400).json({
        success: false,
        message: isSizeLimit ? "File size must be 5 MB or less." : error.message
      });
    }

    next();
  });
};

export const uploadToCloudinary = async (file, projectId) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `collabsphere/projects/${projectId}`,
        resource_type: "auto",
        type: "authenticated",
        use_filename: true,
        unique_filename: true
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
};

export default handleSingleFileUpload;
