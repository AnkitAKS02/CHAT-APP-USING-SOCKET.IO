import bcrypt from 'bcryptjs';
import cloudinary from 'cloudinary';
import User from '../models/user.model.js';
import {generateToken} from '../utils/generateToken.js';

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

        if ( !isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        generateToken(user._id, res);

        res.status(200).json({
            _id: user._id,
            name: user.fullName,
            username: user.username,
            profilePic: user.profilePic,
        });
    } catch (error) {
        console.log("Error in login controller:", error.message);
        res.status(500).json({message : "Internal server error"});
    }

}

export const signup = async (req, res) => {
    const {  fullName,email, password } = req.body;
    try {
        if (!email || !fullName || !password) {
            return res.status(400).json({ message : "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must of 6 characters" });
        }
        const existingUser = await User.findOne({ email });

        if (existingUser) return res.status(400).json({ message: "User already exists" })
        
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
        })

        if (newUser) {
            generateToken(newUser._id, res);
            await newUser.save();

            res.status(201).json({
                _id:newUser._id,
                name: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
            });
        } else {
            res.status(400).json({ message: "User registration failed" });
        }
    } catch (error) {
        console.log("Error in signup controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const logout = async (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({ message: "User Logged out successfully" });
    } catch (e) {
        console.log("Error in logout controller:",e.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const updateProfile = async (req, res) => {
    try {
        const { profilePic } = req.body;
        const userId = req.user._id;

        if(!profilePic) {
            return res.status(400).json({ message: "Profile picture is required" });
        }
        const uploadResponse = await cloudinary.uploader.upload(profilePic);

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePic: uploadResponse.secure_url },
            { new: true }
        );

        res.status(200).json(updatedUser);
    } catch (e) {
        console.log("Error in updateProfile controller:", e.message);
        res.status(500).json({ message : "Internal server error" });
    }
}

export const checkAuth = async (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}