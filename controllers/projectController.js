import Project from "../models/Project";

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


export const getUserProjects =  async(req, res) => {
    try {
        const projects = await Project.find({teamMembers: req.user._id}).populate("createdBy", "name");
        res.status(200).json(projects);
    } catch (err) {
        
    }
}