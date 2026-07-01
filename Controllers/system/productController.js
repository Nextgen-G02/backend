import Product from '../../models/product.model.js';
import Inventory from '../../models/Inventory.js';
import InventoryHistory from '../../models/InventoryHistory.js';
import Expense from '../../models/Expense.js';
import Purchase from '../../models/Purchase.js';
import Supplier from '../../models/Supplier.js';
import Category from '../../models/category.model.js';

// Helper to log automated purchase for financials
const logAutomatedPurchase = async (product, quantity, costPrice) => {
    try {
        if (quantity <= 0 || costPrice <= 0) return;

        let supplier = await Supplier.findOne({ name: "System / Direct" });
        if (!supplier) {
            // Attempt to find by supplierId if name changed
            supplier = await Supplier.findOne({ supplierId: "SUP-SYSTEM" });
            
            if (!supplier) {
                supplier = await Supplier.create({
                    name: "System / Direct",
                    supplierId: "SUP-SYSTEM",
                    phone1: "0000000000",
                    productsSupplied: "Direct Inventory Entry",
                    status: "Active"
                });
            }
        }

        const totalCost = Number(quantity) * Number(costPrice);

        await Purchase.create({
            supplier: supplier._id,
            productName: product.pName,
            quantity: Number(quantity),
            unitPrice: Number(costPrice),
            cost: totalCost,
            paidAmount: totalCost,
            balance: 0,
            supplyDate: new Date()
        });
    } catch (error) {
        console.error("Failed to log automated purchase:", error);
    }
};

export const addProduct = async (req, res) => {
    try {
        const {
            productId,
            pName,
            pCategory,
            description,
            images,
            // weight,
            price,
            costPrice,
            stock,
            expiryDate,
            unit,
            status,
            discountPercentage,
            isIngredient,
            recipe
        } = req.body;

        const numPrice = Number(price);
        const numCostPrice = Number(costPrice);
        const numDiscountPercent = Number(discountPercentage) || 0;

        if (numPrice <= 0 || numCostPrice <= 0) {
            return res.status(400).json({success: false,message: 'Price and Cost Price must be greater than 0'});
        }

        const discountAmount = numPrice * (numDiscountPercent / 100);
        if ((numPrice - discountAmount) <= numCostPrice) {
            return res.status(400).json({success: false,message: 'Selling price after discount must be greater than cost price to ensure profit'});
        }

        const existingProduct = await Product.findOne({ productId });
        if (existingProduct) {
            return res.status(400).json({success: false,message: 'Product ID already exists'});
        }

        // Check if category is active
        const category = await Category.findOne({ name: pCategory });
        if (category && category.status === 'Inactive') {
            return res.status(400).json({ success: false, message: 'Cannot add product to an inactive category' });
        }

        let stockStatus = "In Stock";
        if (stock === 0) {
            stockStatus = "Out of Stock";
        } else if (stock < 5) {
            stockStatus = "Low Stock";
        }

        const newProduct = new Product({
            productId,
            pName,
            pCategory,
            description,
            images,
            // weight,
            price,
            costPrice,
            stock,
            expiryDate,
            unit,
            status,
            stockStatus,
            discountPercentage: numDiscountPercent,
            isIngredient: isIngredient || false,
            recipe: recipe || []
        });

        await newProduct.save();

        // Create Inventory record for the new product
        await Inventory.create({
            productId: newProduct._id,
            quantity: newProduct.stock,
            lowStockLevel: 5, // Default set the low level to 5 
            lastUpdated: new Date()
        });

        // only run this if stock exists
        if (newProduct.stock > 0) {
            await InventoryHistory.create({
                productId: newProduct._id,
                type: 'IN',
                quantity: newProduct.stock,
                reason: 'Initial Product Add',
                date: new Date()
            });
        }

        // Auto-log Purchase Cost for Financials
        if (newProduct.stock > 0 && newProduct.costPrice > 0) {
            await logAutomatedPurchase(newProduct, newProduct.stock, newProduct.costPrice);
        }
        res.status(201).json({success: true,message: 'Product added successfully',data: newProduct});
    }
    catch (error) {
        res.status(500).json({success: false,message: 'Failed to add product',error: error.message});
    }
};

export const getProducts = async (req, res) => {
    try {
        // Optimization: Exclude heavy recipe and description data for faster POS rendering
        const products = await Product.find({})
            .select('-recipe')
            .lean();
            
        res.status(200).json({
            success: true,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products',
            error: error.message
        });
    }
};

export const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        // Strip trailing 's' if present to find the base singular word
        const baseCategory = category.endsWith('s') ? category.slice(0, -1) : category;
        const products = await Product.find({
            pCategory: { $regex: new RegExp(`^${baseCategory}s?$`, 'i') }
        });

        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products by category',
            error: error.message
        });
    }
};

export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch product details', error: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const oldProduct = await Product.findById(req.params.id);
        if (!oldProduct) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const { stock, price, costPrice, pCategory, discountPercentage } = req.body;

        // Validation for price, discountPercentage and costPrice
        const currentPrice = price !== undefined ? Number(price) : oldProduct.price;
        const currentCostPrice = costPrice !== undefined ? Number(costPrice) : oldProduct.costPrice;
        const currentDiscountPercent = discountPercentage !== undefined ? Number(discountPercentage) : oldProduct.discountPercentage;

        const discountAmount = currentPrice * (currentDiscountPercent / 100);
        if ((currentPrice - discountAmount) <= currentCostPrice) {
            return res.status(400).json({success: false,message: 'Selling price after discount must be greater than cost price to ensure profit'});
        }

        // Check if new category is active
        if (pCategory && pCategory !== oldProduct.pCategory) {
            const category = await Category.findOne({ name: pCategory });
            if (category && category.status === 'Inactive') {
                return res.status(400).json({ success: false, message: 'Cannot move product to an inactive category' });
            }
        }

        if ((price !== undefined && price <= 0) || (costPrice !== undefined && costPrice <= 0)) {
            return res.status(400).json({success: false,message: 'Price and Cost Price must be greater than 0'});
        }
        const newStock = Number(stock); // stock count
        if (stock !== undefined && newStock !== oldProduct.stock) {   // this is run only stock is changed
            const difference = newStock - oldProduct.stock;
            const type = difference > 0 ? 'IN' : 'OUT';
            const reason = req.body.updateReason || "Inventory Update";

            await InventoryHistory.create({
                productId: oldProduct._id,
                type,
                quantity: Math.abs(difference),
                reason,
                date: new Date()
            });

            await Inventory.findOneAndUpdate(
                { productId: oldProduct._id },
                { quantity: newStock, lastUpdated: new Date() },
                { upsert: true }  // if not fount create new record
            );

    
            if (type === 'IN' && difference > 0) {
                const currentCostPrice = costPrice !== undefined ? costPrice : oldProduct.costPrice;
                await logAutomatedPurchase(oldProduct, difference, currentCostPrice);
            }

            // Automatically log financial loss if expired or damaged
            if (type === 'OUT' && (reason === 'Expired' || reason === 'Damaged')) {
                const lossAmount = Math.abs(difference) * (oldProduct.costPrice || 0);
                if (lossAmount > 0) {
                    await Expense.create({
                        category: 'Other',
                        amount: lossAmount,
                        description: `Waste Loss: ${oldProduct.pName} (${Math.abs(difference)} units) - ${reason}`,
                        date: new Date()
                    });
                }
            }

            //Update the Stock Availability status
            let stockStatus = "In Stock";
            if (newStock === 0) stockStatus = "Out of Stock";
            else if (newStock < 5) stockStatus = "Low Stock";
            req.body.stockStatus = stockStatus;
            req.body.stock = newStock;
        }

        if (price !== undefined) req.body.price = Number(price);
        if (costPrice !== undefined) req.body.costPrice = Number(costPrice);

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        res.status(200).json({ success: true, message: "Product deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};