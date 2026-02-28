import product from '../models/product.model.js';

import React from 'react'
export const addProduct = async (req, res) => {
    try {
        const { 
            productId, 
            pName, 
            pCategory, 
            description, 
            images, 
            weight, 
            price, 
            stock
         } = req.body;

         const existingProduct = await product.findOne({ productId });
            if (existingProduct) {
                return res.status(400).json({ 
                    success:false,
                    message: 'Product ID already exists' 
                });
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
               weight,
               price,
               stock,
               stockStatus
    });

        await newProduct.save();

        res.status(201).json({
            success:true,
            message: 'Product added successfully',
            data: newProduct
        });
    }
    catch (error) {
        res.status(500).json({
            success:false,
            message: 'Failed to add product',
            error: error.message
        });
    }
};
