import Purchase from "../../models/Purchase.js";

// @desc    Get all purchases for a specific supplier
// @route   GET /api/purchases/supplier/:supplierId
// @access  Private/Admin
export const getSupplierPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find({ supplier: req.params.supplierId }).sort({ supplyDate: -1 });
    res.status(200).json({ success: true, data: purchases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new purchase/supply record
// @route   POST /api/purchases
// @access  Private/Admin
export const createPurchase = async (req, res) => {
  try {
    const { supplier, productName, quantity, unitPrice, cost, paidAmount, supplyDate } = req.body;
    
    const balance = cost - paidAmount;

    const purchase = await Purchase.create({
      supplier,
      productName,
      quantity,
      unitPrice,
      cost,
      paidAmount,
      balance,
      supplyDate
    });

    res.status(201).json({ success: true, data: purchase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a purchase record
// @route   DELETE /api/purchases/:id
// @access  Private/Admin
export const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    await purchase.deleteOne();
    res.status(200).json({ success: true, message: "Record deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};