import User from "../../models/user.js";
import bcrypt from "bcrypt";
import generateToken from "../../utils/generateToken.js";
import { OAuth2Client } from 'google-auth-library';
import sendEmail from "../../utils/sendEmail.js";

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
        
        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);

        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            isVerified: false,
            otp: hashedOtp,
            otpExpires: Date.now() + 10 * 60 * 1000 // 10 minutes
        });

        // Send OTP email
        const message = `
            <h1>Welcome to Nirosha Sweet House!</h1>
            <p>Your OTP for account verification is: <strong>${otp}</strong></p>
            <p>This OTP is valid for 10 minutes.</p>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: "Account Verification - Nirosha Sweet House",
                html: message
            });
        } catch (error) {
            // Delete user if email fails to send
            await User.findByIdAndDelete(user._id);
            return res.status(500).json({ message: "Could not send verification email. Please try again later." });
        }

        res.status(201).json({
            message: "Registration successful. Please check your email for the OTP to verify your account.",
            email: user.email
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
        const {email: identifier, password} = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                message: "Email/NIC and password are required"
            });
        }

        const user = await User.findOne({
            $or: [
                { email: identifier },
                { nic: identifier }
            ]
        }).select("+password");

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

        if (!user.isVerified) {
            // Check if user is staff or admin, they might not need verification or we should verify them manually
            if (user.role === 'customer') {
                return res.status(403).json({
                    message: "Please verify your email before logging in.",
                    notVerified: true,
                    email: user.email
                });
            }
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
    const { firstName, lastName, email, password, nic, address } = req.body;

    if (!firstName || !lastName || !password || !nic || !address) {
      return res.status(400).json({
        message: "First name, last name, password, NIC, and address are required"
      });
    }

    const finalEmail = email || `${nic}@nirosha.com`;

    const existingUser = await User.findOne({ $or: [{ email: finalEmail }, { nic }] });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email or NIC already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await User.create({
      firstName,
      lastName,
      email: finalEmail,
      password: hashedPassword,
      role: "staff",
      nic,
      address
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
        console.error("Error creating staff:", error);
        
        // Handle Mongoose Validation Errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                message: messages.join(', ')
            });
        }
        
        // Handle MongoDB Duplicate Key Error (just in case)
        if (error.code === 11000) {
            return res.status(400).json({
                message: "A user with this Email or NIC already exists in the database."
            });
        }

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
        const { firstName, lastName, email, role, password, nic, address } = req.body;
        const updateData = { firstName, lastName, role, nic, address };
        
        if (email) {
            updateData.email = email;
        } else if (nic) {
            updateData.email = `${nic}@nirosha.com`;
        }

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

export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        const user = await User.findOne({ email }).select("+otp +otpExpires");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "Account is already verified" });
        }

        if (!user.otp || !user.otpExpires) {
            return res.status(400).json({ message: "Invalid OTP request" });
        }

        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }

        const isMatch = await bcrypt.compare(otp, user.otp);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Mark as verified and clear OTP fields
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        const token = generateToken(user);

        res.status(200).json({
            message: "Account verified successfully",
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
        console.error("Verify OTP Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "Account is already verified" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);

        user.otp = hashedOtp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        const message = `
            <h1>Nirosha Sweet House</h1>
            <p>Your new OTP for account verification is: <strong>${otp}</strong></p>
            <p>This OTP is valid for 10 minutes.</p>
        `;

        await sendEmail({
            email: user.email,
            subject: "Resend OTP - Nirosha Sweet House",
            html: message
        });

        res.status(200).json({ message: "A new OTP has been sent to your email" });
    } catch (error) {
        console.error("Resend OTP Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "No account found with that email address." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);

        user.otp = hashedOtp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
        await user.save();

        const message = `
            <h1>Password Reset - Nirosha Sweet House</h1>
            <p>You requested a password reset. Your OTP is: <strong>${otp}</strong></p>
            <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        `;

        await sendEmail({
            email: user.email,
            subject: "Password Reset OTP",
            html: message
        });

        res.status(200).json({ message: "Password reset OTP sent to email." });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Email, OTP, and new password are required" });
        }

        const user = await User.findOne({ email }).select("+otp +otpExpires");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.otp || !user.otpExpires) {
            return res.status(400).json({ message: "Invalid reset request" });
        }

        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }

        const isMatch = await bcrypt.compare(otp, user.otp);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.otp = undefined;
        user.otpExpires = undefined;
        // Just in case they reset password before verifying, we can consider them verified
        user.isVerified = true; 
        
        await user.save();

        res.status(200).json({ message: "Password has been reset successfully. You can now login." });
    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};


