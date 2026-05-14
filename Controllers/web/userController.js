import User from "../../models/user.js";
import bcrypt from "bcrypt";
import generateToken from "../../utils/generateToken.js";
import { OAuth2Client } from 'google-auth-library';

// Create Google OAuth client using client ID from environment variables
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
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

export const createStaff = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: "staff"
    });

    res.status(201).json({
      message: "Staff account created successfully",
      user: {
        id: staff._id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        role: staff.role
      }
    });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
};

// GET ALL STAFF
export const getAllStaff = async (req, res) => {
    try {
        const staff = await User.find({ role: { $in: ['staff', 'admin'] } }).select('-password');
        res.status(200).json({ success: true, data: staff });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE USER
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user && user.role === 'admin') {
             return res.status(403).json({ success: false, message: 'Cannot delete admin' });
        }
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// UPDATE USER
export const updateUser = async (req, res) => {
    try {
        // Extract updated fields from request body
        const { firstName, lastName, email, role, password } = req.body;
        // Store updated fields inside object
        const updateData = { firstName, lastName, email, role };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }  // Return updated document
        ).select('-password');  // Hide password field

        res.status(200).json({ success: true, data: updatedUser, message: 'User updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const googleLogin = async (req, res) => {
  try {
    const { tokenId } = req.body;

    if (!tokenId) {
      return res.status(400).json({
        message: "Token ID is required"
      });
    }

    // Verify token using Google API
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    // Get user data from Google payload
    const { email, given_name, family_name, picture, sub: googleId } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (!user) {
      // Register new user if they don't exist
      user = await User.create({
        firstName: given_name,
        lastName: family_name || " ",
        email,
        password: await bcrypt.hash(Math.random().toString(36).slice(-10), 10), // Random password
        role: "customer",
        isActive: true,
        isBlocked: false
      });
    }

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      message: "Google login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(401).json({
      message: "Google authentication failed"
    });
  }
};

