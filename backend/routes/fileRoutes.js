import express from "express";

import {
  uploadFile,
  getProjectFiles,
  previewFile,
  deleteFile
} from "../controllers/fileController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import handleSingleFileUpload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post(
  "/:projectId/files",
  authMiddleware,
  handleSingleFileUpload,
  uploadFile
);
router.get("/:projectId/files", authMiddleware, getProjectFiles);
router.get("/:projectId/files/:fileId/preview", authMiddleware, previewFile);
router.delete("/:projectId/files/:fileId", authMiddleware, deleteFile);

export default router;
