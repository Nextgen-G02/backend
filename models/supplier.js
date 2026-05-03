import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Supplier name is required"],
    trim: true,
  },
  supplierId: {
    type: String,
    unique: true,
  },
  contactPerson: {
    type: String,
    trim: true,
  },
  phone1: {
    type: String,
    trim: true,
  },
  phone2: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  address: {
    type: String,
    trim: true,
  },
  productsSupplied: {
    type: String,
    required: [true, "Products supplied are required"],
    trim: true,
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
  },
  creditBalance: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Supplier = mongoose.model("Supplier", supplierSchema);
export default Supplier;