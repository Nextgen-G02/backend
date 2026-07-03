import SystemAlert from '../../models/SystemAlert.js';

// Get all unread system alerts
export const getUnreadAlerts = async (req, res) => {
    try {
        const alerts = await SystemAlert.find({ read: false }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: alerts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Mark a single alert as read
export const markAsRead = async (req, res) => {
    try {
        const alert = await SystemAlert.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );
        if (!alert) {
            return res.status(404).json({ success: false, message: "Alert not found" });
        }
        res.status(200).json({ success: true, data: alert });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Mark all unread alerts as read
export const markAllAsRead = async (req, res) => {
    try {
        await SystemAlert.updateMany({ read: false }, { read: true });
        res.status(200).json({ success: true, message: "All alerts marked as read" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
