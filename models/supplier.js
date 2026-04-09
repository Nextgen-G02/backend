import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
    {
        supplierName: {
            type: String,
            required: true,
        },

        phone: {
            type: String,
            required: true,
        },

        email: {
            type: String,
        },

        address: {
            type: String,
        },

        suppliedProducts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product' 
            }
        ],

        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active'
        }
    },
    { timestamps: true }
);

export default mongoose.model("Supplier", supplierSchema);
