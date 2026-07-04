import Expense from '../../models/Expense.js';

export const createExpense = async (req, res) => {
    try {
        const { category, amount, description, date } = req.body;
        const expenseDate = date ? new Date(date) : new Date();
        expenseDate.setHours(0, 0, 0, 0);

        const newExpense = new Expense({
            category,
            amount,
            description,
            date: expenseDate,
            createdBy: req.user?._id 
        });
        await newExpense.save();
        res.status(201).json({ success: true, data: newExpense });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getExpenses = async (req, res) => {
    try {
        const { startDate, endDate, category } = req.query;
        let query = {};

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            };
        }

        if (category) {
            query.category = category;
        }

        const expenses = await Expense.find(query).sort({ date: -1, createdAt: -1 });
        res.status(200).json({ success: true, data: expenses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        if (req.body.date) {
            const expenseDate = new Date(req.body.date);
            expenseDate.setHours(0, 0, 0, 0);
            req.body.date = expenseDate;
        }
        const updatedExpense = await Expense.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedExpense) {
            return res.status(404).json({ success: false, message: 'Expense not found' });
        }
        res.status(200).json({ success: true, data: updatedExpense });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedExpense = await Expense.findByIdAndDelete(id);
        if (!deletedExpense) {
            return res.status(404).json({ success: false, message: 'Expense not found' });
        }
        res.status(200).json({ success: true, message: 'Expense deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
//now not use, using to future add the bar chart or pie chart 
export const getExpenseStats = async (req, res) => {
    try {
        const stats = await Expense.aggregate([
            {
                $group: {
                    _id: "$category",
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            }
        ]);
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
