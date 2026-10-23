import express from "express";

import {
  createTestData,
  getTestData,
  createProject,
  getProjects,
  updateProject,
  deleteProject,
  addProjectMember,
  getProjectMembers,
  removeProjectMember,
  askProjectAI,
  getAnalytics,
  getPublicProject,
  explainText,
  generateDocs,
  generateReadme
} from "../controllers/projectController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/test", createTestData);
router.get("/test", getTestData);

router.post("/projects", authMiddleware, createProject);
router.get("/projects", authMiddleware, getProjects);
router.put("/projects/:id", authMiddleware, updateProject);
router.delete("/projects/:id", authMiddleware, deleteProject);
router.post("/projects/:id/members", authMiddleware, addProjectMember);
router.get("/projects/:id/members", authMiddleware, getProjectMembers);
router.delete("/projects/:id/members/:userId", authMiddleware, removeProjectMember);

router.post("/ai/ask", authMiddleware, askProjectAI);
router.get("/analytics", authMiddleware, getAnalytics);
router.get("/public/projects/:id", getPublicProject);

router.post("/gemini/explain", authMiddleware, explainText);
router.post("/gemini/docs", authMiddleware, generateDocs);
router.post("/gemini/readme", authMiddleware, generateReadme);

export default router;
