import express from "express";
import auth from "../middleware/auth.js"
import {
  createTicket,
  getTicketsByProject,
  updateTicket,
  deleteTicket
} from "../controllers/ticketController.js";

const router = express.Router();

router.post("/", auth, createTicket);
router.get("/:projectId", auth, getTicketsByProject);
router.put("/:id", auth, updateTicket);
router.delete("/:id", auth, deleteTicket);

router.get("/all", auth, async (req, res) => {
  try {
    const tickets = await Ticket.find({ createdBy: req.user._id })
      .populate("assignee", "name")
      .populate("projectId", "title");
    res.status(200).json(tickets);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch all tickets", error: err.message });
  }
});


export default router;
