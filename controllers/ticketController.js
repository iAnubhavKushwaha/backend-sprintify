//server\controllers\ticketController.js

import Ticket from "../models/Ticket.js";

export const createTicket = async (req, res) => {
  const { title, description, projectId, assignee, priority } = req.body;
  try {
    const ticket = await Ticket.create({
      title,
      description,
      projectId,
      assignee,
      priority,
      createdBy: req.user._id
    });
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ msg: "Ticket creation failed", error: err.message });
  }
};

export const getTicketsByProject = async (req, res) => {
  try {
    const tickets = await Ticket.find({ projectId: req.params.projectId })
      .populate("assignee", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch tickets", error: err.message });
  }
};

export const updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(ticket);
  } catch (err) {
    res.status(500).json({ msg: "Failed to update ticket", error: err.message });
  }
};

export const deleteTicket = async (req, res) => {
  try {
    await Ticket.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Ticket deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to delete ticket", error: err.message });
  }
};
