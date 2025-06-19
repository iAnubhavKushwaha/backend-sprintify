// server/models/Ticket.js
import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  priority: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
  status: { type: String, enum: ["To Do", "In Progress", "In Review", "Done"], default: "To Do" }, 
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

export default mongoose.model("Ticket", ticketSchema);