import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js'
import auth from '../middleware/auth.js'

const router = express.Router();

// Register
router.post('/register', async (req,res) => {
    try {
        const {name, email, password} = req.body;

        const existing = await User.findOne({email});
        if(existing) return res.status(400).json({msg: 'User already exists'});

        const hash = await bcrypt.hash(password, 10);
        const user = new User({name, email, password:hash});
        await user.save();

        const token = jwt.sign(
            {id: user._id}, 
            process.env.JWT_SECRET,
            {expiresIn: '7d'}
        );

        res.json({
            token, 
            user: {
                _id: user._id,
                name, 
                email
            }
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({msg: 'Server error during registration'});
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const {email, password} = req.body;
        
        console.log("Login attempt for:", email);
        
        const user = await User.findOne({email});
        if(!user) return res.status(400).json({msg: 'Invalid credentials'});

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) return res.status(400).json({msg: 'Invalid credentials'});

        const token = jwt.sign(
            {id: user._id}, 
            process.env.JWT_SECRET,
            {expiresIn: '7d'}
        );

        res.json({
            token, 
            user: {
                _id: user._id, 
                name: user.name, 
                email: user.email
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({msg: 'Server error during login'});
    }
});

// Token verification route
router.get('/verify', auth, (req, res) => {
    try {
        res.json({ 
            success: true,
            user: {
                _id: req.user._id,
                name: req.user.name,
                email: req.user.email
            }
        });
    } catch (error) {
        console.error("Verify route error:", error);
        res.status(500).json({msg: 'Server error during verification'});
    }
});

export default router;