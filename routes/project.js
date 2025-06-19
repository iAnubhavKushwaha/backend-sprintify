// server/routes/project.js
import express from "express";
import auth from "../middleware/auth.js";
import {
  createProject,
  deleteProject,
  getProjects,
  updateProject,
  getProjectById
} from "../controllers/projectController.js"

const router = express.Router();

router.post("/", auth, createProject);                // POST /api/projects
router.get("/", auth, getProjects);                   // GET /api/projects
router.get("/:id", auth, getProjectById);             // GET /api/projects/:id
router.put("/:id", auth, updateProject);              // PUT /api/projects/:id
router.delete("/:id", auth, deleteProject);           // DELETE /api/projects/:id

export default router;