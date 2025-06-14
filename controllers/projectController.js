import Project from "../models/Project.js";

export const createProject = async (req, res) => {
  const { title, description } = req.body;

  try {
    const project = await Project.create({
      title,
      description,
      createdBy: req.user._id,
      teamMembers: [req.user._id],
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ msg: "Error Creating Project", error: err.message });
  }
};

export const getUserProjects = async (req, res) => {
  try {
    const projects = await Project.find({ teamMembers: req.user._id }).populate(
      "createdBy",
      "name"
    );
    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ msg: "Error Fetching Project", error: err.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json(project);
  } catch (err) {
    res.status(500).json({ msg: "Error Updating Project", error: err.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Project Deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Deleting Project Failed", error: err.message });
  }
};
