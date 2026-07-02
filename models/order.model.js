import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    customerName: { type: String, default: 'Walk-in Customer' },
    phone: { type: String },
    address: { type: String },
    items: [
        {
            pName: { type: String, required: true },
            category: { type: String, required: true },
            quantity: { type: Number, required: true },
            unit: { type: String, default: 'pcs' },
            price: { type: Number, required: true },
            description: { type: String },
            customization: {
                message: { type: String },
                flavor: { type: String },
                specialInstructions: { type: String }
            }
        }

    ],
    totalAmount: { type: Number, default: 0 },
    orderStatus: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    paymentStatus: {
        type: String,
        enum: ['Paid', 'Unpaid', 'Partially Paid'],
        default: 'Unpaid'
    },
    advanceAmount: { type: Number, default: 0 },
    scheduleDate: { type: String },
    scheduleTime: { type: String },
    type: {
        type: String,
        enum: ['Order', 'DirectSale'],
        default: 'Order'
    },
    source: {
        type: String,
        enum: ['Website', 'In-Store'],
        default: 'In-Store'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    imei: { type: String }
}, { timestamps: true });

orderSchema.index({ customerName: 'text' });
orderSchema.index({ scheduleDate: 1 });
orderSchema.index({ orderStatus: 1 });


orderSchema.pre('save', async function () {
    this.totalAmount = this.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);

    // Automation for DirectSale
    if (this.type === 'DirectSale') {
        this.paymentStatus = 'Paid';
        this.advanceAmount = this.totalAmount;
    } else {
        // Automation for Scheduled Orders
        if (this.advanceAmount >= this.totalAmount && this.totalAmount > 0) {
            this.paymentStatus = 'Paid';
        } else if (this.advanceAmount > 0) {
            this.paymentStatus = 'Partially Paid';
        } else {
            this.paymentStatus = 'Unpaid';
        }
    }
});



export default mongoose.model('Order', orderSchema);