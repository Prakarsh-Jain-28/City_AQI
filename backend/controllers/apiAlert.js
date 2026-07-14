const Alert = require("../models/Alert");
const { notifyAdmins } = require("../utils/notifier");
const { getIO } = require("../sockets/socket");
const EVENTS = require("../sockets/socketEvents");

async function getAllAlerts(req, res) {
    try {
        const alerts = await Alert.find()
            .populate("createdBy", "name email role")
            .sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            count: alerts.length,
            alerts: alerts,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function getAlertById(req, res) {
    try {
        const alert = await Alert.findById(req.params.id)
            .populate("createdBy", "name email role");
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: "Alert not found",
            });
        }
        return res.status(200).json({
            success: true,
            alert: alert,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function createAlert(req, res) {
    try {
        const { title, description, severity, targetArea, expiresAt, durationHours, advisories } = req.body;
        const alert = await Alert.create({
            title,
            description,
            severity,
            targetArea,
            createdBy: req.user._id,
            expiresAt,
            durationHours,
            advisories,
        });

        const populatedAlert = await Alert.findById(alert._id)
            .populate("createdBy", "name email role");

        const io = getIO();
        if (io) {
            io.emit(EVENTS.EMERGENCY_ALERT, populatedAlert);
        }

        return res.status(201).json({
            success: true,
            message: "Alert created successfully",
            alert: populatedAlert,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function updateAlert(req, res) {
    try {
        const alert = await Alert.findByIdAndUpdate(
            req.params.id,
            req.body,
            { returnDocument: 'after', runValidators: true }
        ).populate("createdBy", "name email role");

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: "Alert not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Alert updated successfully",
            alert: alert,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function deleteAlert(req, res) {
    try {
        const alert = await Alert.findByIdAndDelete(req.params.id);
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: "Alert not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Alert deleted successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function broadcastAlert(req, res) {
    try {
        const { title, description, severity, targetArea, expiresAt, durationHours, advisories } = req.body;
        const alert = await Alert.create({
            title,
            description,
            severity,
            targetArea,
            createdBy: req.user._id,
            expiresAt,
            durationHours,
            advisories,
            isActive: true,
        });

        const populatedAlert = await Alert.findById(alert._id)
            .populate("createdBy", "name email role");

        const io = getIO();
        if (io) {
            io.emit(EVENTS.EMERGENCY_ALERT, {
                type: "BROADCAST",
                alert: populatedAlert,
            });
        }

        return res.status(201).json({
            success: true,
            message: "Alert broadcasted successfully",
            alert: populatedAlert,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

module.exports = {
    getAllAlerts,
    getAlertById,
    createAlert,
    updateAlert,
    deleteAlert,
    broadcastAlert,
}
