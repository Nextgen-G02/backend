import User from "../Models/User.js";
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken.js";

export const registerUser = async (req, res) => {
    try {
        const {firstName, lastName, email, password} = req.body;

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const existingUser = await User.findOne({email});

        if(existingUser){
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword
        });

        const token = generateToken(user);

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error){
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
}


export const loginUser = async (req, res) => {
    try {
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({email}).select("+password");

        if(!user || user.isBlocked || !user.isActive){
            return res.status(401).json({
                message: "Invalid credentials or account is blocked/inactive"
            });
        }

        const isMAtch = await bcrypt.compare(password, user.password);

        if(!isMAtch){
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const token = generateToken(user);

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
        } catch (error){
            console.error(error);
            res.status(500).json({
                message: "Server error"
            });
        }
}