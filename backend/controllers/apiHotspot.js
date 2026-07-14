const Hotspot = require("../models/Hotspot");
const { notifyAdmins } = require("../utils/notifier");
const { getIO } = require("../sockets/socket");
const EVENTS = require("../sockets/socketEvents");

async function getHotspots(req, res) {
    try {
        const filters = {};
        if (req.query.status) filters.status = req.query.status;
        if (req.query.severity) filters.severity = req.query.severity;

        const hotspots = await Hotspot.find(filters).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            count: hotspots.length,
            hotspots: hotspots,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function getHotspot(req, res) {
    try {
        const hotspot = await Hotspot.findById(req.params.id);
        if (!hotspot) {
            return res.status(404).json({
                success: false,
                message: "Hotspot not found",
            });
        }
        return res.status(200).json({
            success: true,
            hotspot: hotspot,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function createHotspot(req, res) {
    try {
        const { name, location, latitude, longitude, aqi, severity, source, recommendation } = req.body;
        const hotspot = await Hotspot.create({
            name,
            location,
            latitude,
            longitude,
            aqi,
            severity,
            source,
            recommendation,
        });

        notifyAdmins("New Hotspot Detected", `A new hotspot has been detected at ${hotspot.location} (AQI: ${hotspot.aqi}).`);

        const io = getIO();
        if (io) {
            io.emit(EVENTS.NEW_HOTSPOT, hotspot);
        }

        return res.status(201).json({
            success: true,
            message: "Hotspot created successfully",
            hotspot: hotspot,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function updateHotspot(req, res) {
    try {
        const hotspot = await Hotspot.findByIdAndUpdate(
            req.params.id,
            req.body,
            { returnDocument: 'after', runValidators: true }
        );

        if (!hotspot) {
            return res.status(404).json({
                success: false,
                message: "Hotspot not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Hotspot updated successfully",
            hotspot: hotspot,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function deleteHotspot(req, res) {
    try {
        const hotspot = await Hotspot.findByIdAndDelete(req.params.id);
        if (!hotspot) {
            return res.status(404).json({
                success: false,
                message: "Hotspot not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Hotspot deleted successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function getCriticalHotspots(req, res) {
    try {
        const hotspots = await Hotspot.find({
            severity: { $in: ["VERY_HIGH", "SEVERE"] },
            status: { $ne: "RESOLVED" },
        }).sort({ aqi: -1 });

        return res.status(200).json({
            success: true,
            count: hotspots.length,
            hotspots: hotspots,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

module.exports = {
    getHotspots,
    getHotspot,
    createHotspot,
    updateHotspot,
    deleteHotspot,
    getCriticalHotspots,
}
