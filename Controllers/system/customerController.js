import Customer from '../../models/customer.model.js';
import User from '../../models/user.js';
import Order from '../../models/order.model.js';

export const getCustomers = async (req, res) => {
    try {
        // Only fetch registered users with role: 'customer'
        const users = await User.find({ role: 'customer' });
        const userIds = users.map(u => u._id);
        const phones = users.map(u => u.phone).filter(p => p);

        // Fetch all orders for these users to calculate statistics by phone or user ID
        const orders = await Order.find({
            $or: [
                { createdBy: { $in: userIds } },
                { phone: { $in: phones } }
            ]
        });

        // Group orders by user ID
        const ordersByUser = {};
        orders.forEach(order => {
            let matchedUser = null;
            if (order.createdBy) {
                matchedUser = users.find(u => u._id.toString() === order.createdBy.toString());
            }
            if (!matchedUser && order.phone) {
                matchedUser = users.find(u => u.phone === order.phone);
            }

            if (matchedUser) {
                const uidStr = matchedUser._id.toString();
                if (!ordersByUser[uidStr]) {
                    ordersByUser[uidStr] = [];
                }
                // Avoid pushing duplicate orders if it matched both criteria
                if (!ordersByUser[uidStr].some(o => o._id.toString() === order._id.toString())) {
                    ordersByUser[uidStr].push(order);
                }
            }
        });

        // Map users to customer data format expected by frontend
        const customerData = users.map(user => {
            const userOrders = ordersByUser[user._id.toString()] || [];
            
            // Calculate total spent and find last order date
            let totalSpent = 0;
            let lastOrderDate = null;
            let displayPhone = user.phone || '';

            userOrders.forEach(order => {
                totalSpent += (order.totalAmount || 0);
                if (!lastOrderDate || new Date(order.createdAt) > new Date(lastOrderDate)) {
                    lastOrderDate = order.createdAt;
                    if (!displayPhone && order.phone) {
                        displayPhone = order.phone;
                    }
                }
            });

            return {
                _id: user._id,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Customer',
                phone: displayPhone || 'N/A',
                address: user.address || '',
                totalOrders: userOrders.length,
                totalSpent: totalSpent,
                lastOrderDate: lastOrderDate,
                email: user.email,
                isRegistered: true,
                isBlocked: user.isBlocked,
                isActive: user.isActive
            };
        });

        // Sort by total spent descending
        customerData.sort((a, b) => b.totalSpent - a.totalSpent);

        res.status(200).json({ success: true, data: customerData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getCustomerByPhone = async (req, res) => {
    try {
        const phone = req.params.phone.trim();
        
        // Find in registered Users only
        let user = await User.findOne({ role: 'customer', phone: phone });
        
        if (!user) {
            const order = await Order.findOne({ phone: phone }).sort({ createdAt: -1 });
            if (order && order.createdBy) {
                user = await User.findById(order.createdBy);
            }
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        const userOrders = await Order.find({
            $or: [
                { createdBy: user._id },
                { phone: user.phone || phone }
            ]
        });

        // Remove duplicates
        const uniqueOrders = [];
        const orderIds = new Set();
        userOrders.forEach(o => {
            if (!orderIds.has(o._id.toString())) {
                orderIds.add(o._id.toString());
                uniqueOrders.push(o);
            }
        });

        const totalSpent = uniqueOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const lastOrderDate = uniqueOrders.length ? uniqueOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt : null;

        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Customer',
                phone: user.phone || phone,
                address: user.address || '',
                totalOrders: uniqueOrders.length,
                totalSpent: totalSpent,
                lastOrderDate: lastOrderDate,
                email: user.email,
                isRegistered: true
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateCustomer = async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        
        let user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        const nameParts = name.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        user = await User.findByIdAndUpdate(
            req.params.id,
            { firstName, lastName, phone, address },
            { new: true, runValidators: true }
        );

        // Keep Customer collection record updated too if sync is needed
        await Customer.findOneAndUpdate(
            { phone: phone },
            { name, address },
            { runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Customer',
                phone: user.phone,
                address: user.address,
                email: user.email,
                isRegistered: true
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteCustomer = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        if (user.phone) {
            await Customer.findOneAndDelete({ phone: user.phone });
        }
        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({ success: true, message: 'Customer deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};