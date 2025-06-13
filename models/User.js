import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: String,
    email: {type:String, require: true, unique: true},
    password: {type:String, require: true},
},{timestamps: true});

export default mongoose.model('User', userSchema);