import Customer from '../../models/customer.model.js';
import User from '../../models/user.js';
import Order from '../../models/order.model.js';

export const getCustomers = async (req, res) => {
    try {
        const users = await User.find({ role: 'customer' });
        const customers = await Customer.find();
        const orders = await Order.find();

        // Maps for quick lookup
        const ordersByUserId = {};
        orders.forEach(order => {
            if (order.createdBy) {
                const uidStr = order.createdBy.toString();
                if (!ordersByUserId[uidStr]) {
                    ordersByUserId[uidStr] = [];
                }
                ordersByUserId[uidStr].push(order);
            }
        });

        const customerByPhone = {};
        customers.forEach(cust => {
            if (cust.phone) {
                customerByPhone[cust.phone.trim()] = cust;
            }
        });

        const processedCustomerIds = new Set();
        const mergedList = [];

        // 1. Process all registered Users with role: 'customer'
        users.forEach(user => {
            const userOrders = ordersByUserId[user._id.toString()] || [];
            
            // Collect all phone numbers associated with this user's orders
            const userPhones = new Set();
            if (user.phone) {
                userPhones.add(user.phone.trim());
            }
            userOrders.forEach(order => {
                if (order.phone) {
                    userPhones.add(order.phone.trim());
                }
            });

            // Find matching Customer record
            let matchedCustomer = null;
            for (const phone of userPhones) {
                if (customerByPhone[phone]) {
                    matchedCustomer = customerByPhone[phone];
                    processedCustomerIds.add(matchedCustomer._id.toString());
                    break;
                }
            }

            // Calculate metrics
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

            // If we matched a Customer record, use its metrics if they are higher
            if (matchedCustomer) {
                totalSpent = Math.max(totalSpent, matchedCustomer.totalSpent || 0);
                if (matchedCustomer.lastOrderDate && (!lastOrderDate || new Date(matchedCustomer.lastOrderDate) > new Date(lastOrderDate))) {
                    lastOrderDate = matchedCustomer.lastOrderDate;
                }
                if (!displayPhone && matchedCustomer.phone) {
                    displayPhone = matchedCustomer.phone;
                }
            }

            mergedList.push({
                _id: user._id,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Customer',
                phone: displayPhone || 'N/A',
                address: user.address || (matchedCustomer ? matchedCustomer.address : ''),
                totalOrders: Math.max(userOrders.length, matchedCustomer ? matchedCustomer.totalOrders : 0),
                totalSpent: totalSpent,
                lastOrderDate: lastOrderDate,
                email: user.email,
                isRegistered: true,
                isBlocked: user.isBlocked,
                isActive: user.isActive
            });
        });

        // 2. Add remaining unregistered Customers
        customers.forEach(cust => {
            if (!processedCustomerIds.has(cust._id.toString())) {
                mergedList.push({
                    _id: cust._id,
                    name: cust.name || 'Walk-in Customer',
                    phone: cust.phone || 'N/A',
                    address: cust.address || '',
                    totalOrders: cust.totalOrders || 0,
                    totalSpent: cust.totalSpent || 0,
                    lastOrderDate: cust.lastOrderDate,
                    email: 'N/A',
                    isRegistered: false,
                    isBlocked: false,
                    isActive: true
                });
            }
        });

        // Sort by total spent descending
        mergedList.sort((a, b) => b.totalSpent - a.totalSpent);

        res.status(200).json({ success: true, data: mergedList });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getCustomerByPhone = async (req, res) => {
    try {
        const phone = req.params.phone.trim();
        
        // 1. Try finding in registered Users
        let user = await User.findOne({ role: 'customer', phone: phone });
        
        // 2. Fallback to check if any order has this phone and creator is set
        if (!user) {
            const order = await Order.findOne({ phone: phone }).sort({ createdAt: -1 });
            if (order && order.createdBy) {
                user = await User.findById(order.createdBy);
            }
        }

        // 3. Fallback to Customer collection
        const customer = await Customer.findOne({ phone: phone });

        if (!user && !customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        if (user) {
            const userOrders = await Order.find({ createdBy: user._id });
            let totalSpent = userOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
            let lastOrderDate = userOrders.length ? userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt : null;

            if (customer) {
                totalSpent = Math.max(totalSpent, customer.totalSpent || 0);
                if (customer.lastOrderDate && (!lastOrderDate || new Date(customer.lastOrderDate) > new Date(lastOrderDate))) {
                    lastOrderDate = customer.lastOrderDate;
                }
            }

            res.status(200).json({
                success: true,
                data: {
                    _id: user._id,
                    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Customer',
                    phone: user.phone || phone,
                    address: user.address || (customer ? customer.address : ''),
                    totalOrders: Math.max(userOrders.length, customer ? customer.totalOrders : 0),
                    totalSpent: totalSpent,
                    lastOrderDate: lastOrderDate,
                    email: user.email,
                    isRegistered: true
                }
            });
        } else {
            res.status(200).json({
                success: true,
                data: {
                    _id: customer._id,
                    name: customer.name || 'Walk-in Customer',
                    phone: customer.phone,
                    address: customer.address || '',
                    totalOrders: customer.totalOrders || 0,
                    totalSpent: customer.totalSpent || 0,
                    lastOrderDate: customer.lastOrderDate,
                    email: 'N/A',
                    isRegistered: false
                }
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateCustomer = async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        
        // Check if ID belongs to User
        let user = await User.findById(req.params.id);
        
        if (user) {
            const nameParts = name.trim().split(/\s+/);
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            user = await User.findByIdAndUpdate(
                req.params.id,
                { firstName, lastName, phone, address },
                { new: true, runValidators: true }
            );

            // Also keep matching Customer record in sync if it exists
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
        } else {
            // Otherwise update Customer collection directly
            const customer = await Customer.findByIdAndUpdate(
                req.params.id,
                { name, phone, address },
                { new: true, runValidators: true }
            );

            if (!customer) {
                return res.status(404).json({ success: false, message: 'Customer not found' });
            }

            res.status(200).json({
                success: true,
                data: {
                    _id: customer._id,
                    name: customer.name || 'Walk-in Customer',
                    phone: customer.phone,
                    address: customer.address,
                    email: 'N/A',
                    isRegistered: false
                }
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteCustomer = async (req, res) => {
    try {
        // Check if ID belongs to User
        const user = await User.findById(req.params.id);
        if (user) {
            // If they have a phone, also delete matching Customer profile
            if (user.phone) {
                await Customer.findOneAndDelete({ phone: user.phone });
            }
            await User.findByIdAndDelete(req.params.id);
        } else {
            await Customer.findByIdAndDelete(req.params.id);
        }
        res.status(200).json({ success: true, message: 'Customer deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};