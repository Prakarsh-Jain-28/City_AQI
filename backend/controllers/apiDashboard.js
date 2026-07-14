const Station = require("../models/Station");
const Alert = require("../models/Alert");
const Hotspot = require("../models/Hotspot");
const Assignment = require("../models/Assignment");
const User = require("../models/User");

async function getDashboard(req, res) {
    try {
        const totalStations = await Station.countDocuments();
        const activeStations = await Station.countDocuments({ status: "ACTIVE" });
        const stations = await Station.find({ status: "ACTIVE" }).sort({ AQI: -1 }).limit(10);

        const avgAQI = stations.length > 0
            ? Math.round(stations.reduce((sum, s) => sum + s.AQI, 0) / stations.length)
            : 0;

        const criticalStations = await Station.countDocuments({ AQI: { $gt: 300 } });
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayAlerts = await Alert.countDocuments({ createdAt: { $gte: todayStart } });
        const activeAlerts = await Alert.countDocuments({ isActive: true });
        const activeHotspots = await Hotspot.countDocuments({ status: { $ne: "RESOLVED" } });
        const pendingAssignments = await Assignment.countDocuments({ status: "PENDING" });
        const inProgressAssignments = await Assignment.countDocuments({ status: "IN_PROGRESS" });
        const completedAssignments = await Assignment.countDocuments({ status: "COMPLETED" });
        const totalOfficers = await User.countDocuments({ role: "OFFICER" });

        const recentAlerts = await Alert.find()
            .populate("createdBy", "name")
            .sort({ createdAt: -1 })
            .limit(5);

        const recentHotspots = await Hotspot.find()
            .sort({ createdAt: -1 })
            .limit(5);

        const cityAQIData = await Station.aggregate([
            { $match: { status: "ACTIVE" } },
            {
                $group: {
                    _id: "$city",
                    avgAQI: { $avg: "$AQI" },
                    maxAQI: { $max: "$AQI" },
                    stationCount: { $sum: 1 },
                    avgPM25: { $avg: "$PM25" },
                    avgPM10: { $avg: "$PM10" },
                }
            },
            { $sort: { avgAQI: -1 } }
        ]);

        return res.status(200).json({
            success: true,
            dashboard: {
                stats: {
                    totalStations,
                    activeStations,
                    avgAQI,
                    criticalStations,
                    todayAlerts,
                    activeAlerts,
                    activeHotspots,
                    pendingAssignments,
                    inProgressAssignments,
                    completedAssignments,
                    totalOfficers,
                },
                topStations: stations,
                recentAlerts,
                recentHotspots,
                cityAQIData,
            },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function getDashboardSummary(req, res) {
    try {
        const totalStations = await Station.countDocuments();
        const activeAlerts = await Alert.countDocuments({ isActive: true });
        const activeHotspots = await Hotspot.countDocuments({ status: { $ne: "RESOLVED" } });
        const pendingAssignments = await Assignment.countDocuments({ status: "PENDING" });

        const stations = await Station.find({ status: "ACTIVE" });
        const avgAQI = stations.length > 0
            ? Math.round(stations.reduce((sum, s) => sum + s.AQI, 0) / stations.length)
            : 0;

        return res.status(200).json({
            success: true,
            summary: {
                totalStations,
                avgAQI,
                activeAlerts,
                activeHotspots,
                pendingAssignments,
            },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

module.exports = {
    getDashboard,
    getDashboardSummary,
}
