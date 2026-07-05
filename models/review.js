import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },
        location: {
            type: String,
            trim: true,
            default: "Sri Lanka"
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        }
    },
    { timestamps: true }
);

const Review = mongoose.model("Review", reviewSchema);
export default Review;
