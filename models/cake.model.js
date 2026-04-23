import mongoose from 'mongoose';

const cakeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    image: { type: String },
    weight: { type: String },
    stock: { type: Number, default: 0 }
}, { timestamps: true });

const Cake = mongoose.model('Cake', cakeSchema);
export default Cake;