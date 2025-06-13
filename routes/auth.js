import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js'


const router = express.Router();

// Register
router.post('/register', async (req,res) =>{
    const {name, email, password} = req.body;

    const existing = await User.findOne({email});

    if(existing) return res.status(400).json({msg: 'User already exists'});

    const hash = await bcrypt.hash(password, 10);
    const user = new User({name, email, password:hash});
    await user.save();

    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET);
    res.json({token, user:{id: user._id, name, email}});

})

// Login

router.post('/login', async (req, res) => {
    const {email, password} = req.body;
    const user = await User.findOne({email});

    if(!user) return res.status(400).json({msg: 'Invalid credentials'});

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) return res.status(400).json({msg: 'Invalid credentials'});

    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET);
    res.json({token, user:{id: user._id, name: user.name, email: user.email}});
})

export default router;