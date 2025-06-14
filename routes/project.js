import express from "express";
import auth from "../middleware/auth.js";
import {
  createProject,
  deleteProject,
  getUserProjects,
  updateProject,
} from "../controllers/projectController.js"

const router = express.Router();

router.post("/", auth, createProject);
router.post("/", auth, getUserProjects);
router.post("/", auth, updateProject);
router.post("/", auth, deleteProject);

export default router;
