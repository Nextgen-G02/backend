import Review from "../../models/review.js";

// @desc    Submit a new review
// @route   POST /api/reviews
// @access  Private (Customers/Users)
export const createReview = async (req, res) => {
    try {
        const { rating, text, location } = req.body;
        
        if (!rating || !text) {
            return res.status(400).json({ success: false, message: "Rating and text are required" });
        }

        const review = await Review.create({
            user: req.user._id,
            rating,
            text,
            location: location || "Sri Lanka"
        });

        res.status(201).json({ success: true, data: review, message: "Review submitted successfully. It will appear once approved!" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all approved reviews for public view (Homepage)
// @route   GET /api/reviews
// @access  Public
export const getApprovedReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ status: 'approved' })
            .populate('user', 'firstName lastName')
            .sort({ createdAt: -1 });
            
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all reviews (for Admin panel)
// @route   GET /api/reviews/admin
// @access  Private (Admin/Staff with manage_marketing)
export const getAllReviewsAdmin = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('user', 'firstName lastName email')
            .sort({ createdAt: -1 });
            
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update review status (Approve/Reject)
// @route   PUT /api/reviews/:id/status
// @access  Private (Admin/Staff)
export const updateReviewStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        res.status(200).json({ success: true, data: review, message: `Review marked as ${status}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (Admin/Staff)
export const deleteReview = async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }
        res.status(200).json({ success: true, message: "Review deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
