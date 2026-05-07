import Supplier from "../../models/Supplier.js";

// @desc    Get all suppliers
// @route   GET /api/suppliers
export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({
      $and: [
        { name: { $ne: "System / Direct" } },
        { supplierId: { $ne: "SUP-SYSTEM" } }
      ]
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
export const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new supplier
// @route   POST /api/suppliers
export const createSupplier = async (req, res) => {
  try {
    // Generate unique supplier ID (e.g., SUP-1001)
    const allSuppliers = await Supplier.find({}, { supplierId: 1 });
    let maxId = 1000;
    
    allSuppliers.forEach(s => {
      if (s.supplierId && s.supplierId.startsWith("SUP-")) {
        const num = parseInt(s.supplierId.split('-')[1]);
        if (!isNaN(num) && num > maxId) {
          maxId = num;
        }
      }
    });

    const newId = `SUP-${maxId + 1}`;
    
    const supplierData = { ...req.body, supplierId: newId };
    const supplier = await Supplier.create(supplierData);
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
export const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
export const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }
    res.status(200).json({ success: true, message: "Supplier deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};