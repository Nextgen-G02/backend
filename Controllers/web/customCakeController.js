import CustomCake from '../../models/customCake.model.js';
import { v2 as cloudinary } from 'cloudinary';

// Create a new custom cake request
export const createCustomCakeRequest = async (req, res) => {
    // Configure Cloudinary inside function to ensure dotenv is loaded first
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    try {
        const { customerName, email, phone, address, scheduleDate, quantity, description, referenceImage, user } = req.body;

        let uploadedImageUrl = referenceImage;
        
        // If referenceImage is a base64 string, upload it to Cloudinary
        if (referenceImage && referenceImage.startsWith('data:image')) {
            const uploadResponse = await cloudinary.uploader.upload(referenceImage, {
                folder: 'sweet-house/custom-cakes'
            });
            uploadedImageUrl = uploadResponse.secure_url;
        }

        const newRequest = new CustomCake({
            customerName,
            email,
            phone,
            address,
            scheduleDate,
            quantity,
            description,
            referenceImage: uploadedImageUrl,
            user // Optional, if user is logged in
        });

        const savedRequest = await newRequest.save();

        res.status(201).json({
            message: "Custom cake request submitted successfully. We will review it and get back to you.",
            request: savedRequest
        });
    } catch (error) {
        console.error("Error creating custom cake request:", error);
        res.status(500).json({ message: "Server error. Could not submit request." });
    }
};

// Get all requests for a specific customer (by email or user ID)
export const getCustomerRequests = async (req, res) => {
    try {
        const { identifier, email } = req.query; // Could be email or user ID

        if (!identifier && !email) {
            return res.status(400).json({ message: "Identifier or email is required." });
        }

        const query = { $or: [] };
        
        // If identifier is a valid ObjectId, search by user reference or email field
        if (identifier && identifier.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or.push({ user: identifier });
            query.$or.push({ email: identifier }); // highly unlikely, but safe
        } else if (identifier) {
            query.$or.push({ email: identifier });
        }

        if (email) {
            query.$or.push({ email: email });
        }

        const requests = await CustomCake.find(query).sort({ createdAt: -1 });

        res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching customer requests:", error);
        res.status(500).json({ message: "Server error while fetching requests." });
    }
};

// Update payment status after successful payment
export const updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { amountPaid, isHalfPayment } = req.body;

        const request = await CustomCake.findById(id);
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        if (request.status !== 'Approved') {
            return res.status(400).json({ message: "Order is not in an approved state for payment." });
        }

        request.paymentStatus = isHalfPayment ? 'Partially Paid' : 'Paid';
        request.status = 'Confirmed';

        await request.save();

        res.status(200).json({ message: "Payment recorded successfully. Order is now confirmed.", request });
    } catch (error) {
        console.error("Error updating payment status:", error);
        res.status(500).json({ message: "Server error updating payment status." });
    }
};
