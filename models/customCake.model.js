import mongoose from 'mongoose';

const customCakeSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    scheduleDate: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    description: { type: String, required: true },
    referenceImage: { type: String }, // Base64 string
    
    // Admin assigned fields
    estimatedPrice: { type: Number, default: 0 },
    paymentRequired: { 
        type: String, 
        enum: ['Half', 'Full'], 
        default: 'Full' 
    },
    
    // Tracking statuses
    status: {
        type: String,
        enum: ['Pending Review', 'Approved', 'Rejected', 'Confirmed', 'Preparing', 'Ready', 'Delivered', 'Cancelled'],
        default: 'Pending Review'
    },
    paymentStatus: {
        type: String,
        enum: ['Paid', 'Unpaid', 'Partially Paid'],
        default: 'Unpaid'
    },
    
    // Auth reference
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

export default mongoose.model('CustomCake', customCakeSchema);
