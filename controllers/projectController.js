// server/controllers/projectController.js
import Project from "../models/Project.js";
import User from "../models/User.js";

export const getProjects = async (req, res) => {
  try { 
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'teamMembers.user': req.user._id }
      ]
    })
    .populate('owner', 'name email')
    .populate('teamMembers.user', 'name email')
    .sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ msg: "Failed to fetch projects", error: err.message });
  }
};

export const createProject = async (req, res) => {
  const { title, description, teamMembers = [] } = req.body;
  
  try {
    // Find team members by email and format for nested structure
    let formattedMembers = [];
    if (teamMembers.length > 0) {
      const users = await User.find({ email: { $in: teamMembers } });
      formattedMembers = users.map(user => ({
        user: user._id,
        role: 'member'
      }));
    }

    const project = await Project.create({
      title,
      description,
      owner: req.user._id,
      teamMembers: formattedMembers
    });

    // Populate the created project
    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('teamMembers.user', 'name email');
    res.status(201).json(populatedProject);
  } catch (err) {
    console.error('Project creation failed:', err);
    res.status(500).json({ msg: "Project creation failed", error: err.message });
  }
};

export const getProjectById = async (req, res) => {
  try {   
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('teamMembers.user', 'name email');

    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }

    // Check if user has access
    const hasAccess = project.owner._id.toString() === req.user._id.toString() ||
    project.teamMembers.some(member => member.user._id.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ msg: "Access denied" });
    }
    res.status(200).json(project);
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).json({ msg: "Failed to fetch project", error: err.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }

    // Only project owner can update
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: "Only project owner can update project" });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    )
    .populate('owner', 'name email')
    .populate('teamMembers.user', 'name email');

    res.status(200).json(updatedProject);
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ msg: "Failed to update project", error: err.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }

    // Only project owner can delete
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: "Only project owner can delete project" });
    }

    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Project deleted successfully" });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ msg: "Failed to delete project", error: err.message });
  }
};