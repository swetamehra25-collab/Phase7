import express from "express";

import {
  createNote,
  getNotes,
  updateNote,
  deleteNote,
  explainNote,
  improveNote
} from "../controllers/noteController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:projectId/notes", authMiddleware, createNote);
router.get("/:projectId/notes", authMiddleware, getNotes);
router.put("/:projectId/notes/:noteId", authMiddleware, updateNote);
router.delete("/:projectId/notes/:noteId", authMiddleware, deleteNote);
router.post("/:projectId/notes/:noteId/explain", authMiddleware, explainNote);
router.post("/:projectId/notes/:noteId/improve", authMiddleware, improveNote);

export default router;
