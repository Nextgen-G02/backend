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
        enum: ['Pending', 'Confirmed', 'Preparing', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    paymentStatus: {
        type: String,
        enum: ['Paid', 'Unpaid'],
        default: 'Unpaid'
    },
    scheduleDate: { type: String },
    scheduleTime: { type: String },
    type: {
        type: String,
        enum: ['Order', 'DirectSale'],
        default: 'Order'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

orderSchema.index({ customerName: 'text' });
orderSchema.index({ scheduleDate: 1 });
orderSchema.index({ orderStatus: 1 });


orderSchema.pre('save', async function () {
    this.totalAmount = this.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
});



export default mongoose.model('Order', orderSchema);
