import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    createdBy: {type: mongoose.Schema.Types.ObjectId , ref: 'User', required: true},
    teamMembers:[{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
},{timestamps: true});

export default mongoose.model('Project', projectSchema);