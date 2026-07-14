const Notification = require("../models/Notification");
const { getIO } = require("../sockets/socket");
const EVENTS = require("../sockets/socketEvents");

async function getNotifications(req, res) {
    try {
        const filters = {};
        if (req.query.isRead !== undefined) {
            filters.isRead = req.query.isRead === "true";
        }
        if (req.user) {
            filters.recipient = req.user._id;
        }

        const notifications = await Notification.find(filters)
            .populate("recipient", "name email role")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: notifications.length,
            notifications: notifications,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function getNotification(req, res) {
    try {
        const notification = await Notification.findById(req.params.id)
            .populate("recipient", "name email role");
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }
        return res.status(200).json({
            success: true,
            notification: notification,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function createNotification(req, res) {
    try {
        const { title, message, recipient } = req.body;
        const notification = await Notification.create({
            title,
            message,
            recipient,
        });

        const populatedNotification = await Notification.findById(notification._id)
            .populate("recipient", "name email role");

        const io = getIO();
        if (io) {
            io.to(`user_${recipient}`).emit(EVENTS.NEW_NOTIFICATION, populatedNotification);
        }

        return res.status(201).json({
            success: true,
            message: "Notification created successfully",
            notification: populatedNotification,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function markAsRead(req, res) {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { returnDocument: 'after' }
        ).populate("recipient", "name email role");

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification: notification,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function markAllAsRead(req, res) {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { isRead: true }
        );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function deleteNotification(req, res) {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Notification deleted successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

module.exports = {
    getNotifications,
    getNotification,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
}
