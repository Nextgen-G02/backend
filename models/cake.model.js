const mongoose = require('mongoose');

const cakeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    image: { type: String },
    weight: { type: String },
    stock: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Cake', cakeSchema);
//create a model for cake with name, description, price, category, image, weight and stock. The category should be a reference to the category model.