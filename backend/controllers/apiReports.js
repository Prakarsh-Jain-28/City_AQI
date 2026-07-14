const Station = require("../models/Station");
const Alert = require("../models/Alert");
const Hotspot = require("../models/Hotspot");
const Assignment = require("../models/Assignment");

async function getReports(req, res) {
    try {
        const now = new Date();
        const dailyStart = new Date(now);
        dailyStart.setHours(0, 0, 0, 0);

        const weeklyStart = new Date(now);
        weeklyStart.setDate(weeklyStart.getDate() - 7);

        const monthlyStart = new Date(now);
        monthlyStart.setMonth(monthlyStart.getMonth() - 1);

        return res.status(200).json({
            success: true,
            reports: [
                { type: "daily", label: "Daily Report", period: dailyStart.toISOString().split("T")[0] },
                { type: "weekly", label: "Weekly Report", period: `${weeklyStart.toISOString().split("T")[0]} to ${now.toISOString().split("T")[0]}` },
                { type: "monthly", label: "Monthly Report", period: `${monthlyStart.toISOString().split("T")[0]} to ${now.toISOString().split("T")[0]}` },
            ],
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function getDailyReport(req, res) {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const stations = await Station.find({ status: "ACTIVE" });
        const alerts = await Alert.find({ createdAt: { $gte: todayStart } });
        const hotspots = await Hotspot.find({ status: { $ne: "RESOLVED" } });
        const assignments = await Assignment.find({ createdAt: { $gte: todayStart } });

        const avgAQI = stations.length > 0
            ? Math.round(stations.reduce((sum, s) => sum + s.AQI, 0) / stations.length)
            : 0;

        const cityBreakdown = {};
        stations.forEach(s => {
            if (!cityBreakdown[s.city]) {
                cityBreakdown[s.city] = { totalAQI: 0, count: 0, maxAQI: 0 };
            }
            cityBreakdown[s.city].totalAQI += s.AQI;
            cityBreakdown[s.city].count++;
            cityBreakdown[s.city].maxAQI = Math.max(cityBreakdown[s.city].maxAQI, s.AQI);
        });

        const cityData = Object.entries(cityBreakdown).map(([city, data]) => ({
            city,
            avgAQI: Math.round(data.totalAQI / data.count),
            maxAQI: data.maxAQI,
            stations: data.count,
        })).sort((a, b) => b.avgAQI - a.avgAQI);

        return res.status(200).json({
            success: true,
            report: {
                type: "daily",
                date: todayStart.toISOString().split("T")[0],
                summary: {
                    totalStations: stations.length,
                    avgAQI,
                    totalAlerts: alerts.length,
                    activeHotspots: hotspots.length,
                    totalAssignments: assignments.length,
                },
                cityData,
                generatedAt: new Date(),
            },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function getWeeklyReport(req, res) {
    try {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);

        const stations = await Station.find({ status: "ACTIVE" });
        const alerts = await Alert.find({ createdAt: { $gte: weekStart } });
        const hotspots = await Hotspot.find({ createdAt: { $gte: weekStart } });
        const assignments = await Assignment.find({ createdAt: { $gte: weekStart } });
        const completedAssignments = assignments.filter(a => a.status === "COMPLETED");

        const avgAQI = stations.length > 0
            ? Math.round(stations.reduce((sum, s) => sum + s.AQI, 0) / stations.length)
            : 0;

        return res.status(200).json({
            success: true,
            report: {
                type: "weekly",
                period: {
                    start: weekStart.toISOString().split("T")[0],
                    end: new Date().toISOString().split("T")[0],
                },
                summary: {
                    totalStations: stations.length,
                    avgAQI,
                    totalAlerts: alerts.length,
                    newHotspots: hotspots.length,
                    totalAssignments: assignments.length,
                    completedAssignments: completedAssignments.length,
                    completionRate: assignments.length > 0
                        ? Math.round((completedAssignments.length / assignments.length) * 100)
                        : 0,
                },
                generatedAt: new Date(),
            },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function getMonthlyReport(req, res) {
    try {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - 1);

        const stations = await Station.find({ status: "ACTIVE" });
        const alerts = await Alert.find({ createdAt: { $gte: monthStart } });
        const hotspots = await Hotspot.find({ createdAt: { $gte: monthStart } });
        const resolvedHotspots = await Hotspot.countDocuments({
            status: "RESOLVED",
            updatedAt: { $gte: monthStart },
        });
        const assignments = await Assignment.find({ createdAt: { $gte: monthStart } });

        const avgAQI = stations.length > 0
            ? Math.round(stations.reduce((sum, s) => sum + s.AQI, 0) / stations.length)
            : 0;

        return res.status(200).json({
            success: true,
            report: {
                type: "monthly",
                period: {
                    start: monthStart.toISOString().split("T")[0],
                    end: new Date().toISOString().split("T")[0],
                },
                summary: {
                    totalStations: stations.length,
                    avgAQI,
                    totalAlerts: alerts.length,
                    newHotspots: hotspots.length,
                    resolvedHotspots,
                    totalAssignments: assignments.length,
                },
                generatedAt: new Date(),
            },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function getReport(req, res) {
    try {
        const type = req.params.id;
        if (type === "daily") return getDailyReport(req, res);
        if (type === "weekly") return getWeeklyReport(req, res);
        if (type === "monthly") return getMonthlyReport(req, res);

        return res.status(400).json({
            success: false,
            message: "Invalid report type. Use daily, weekly, or monthly.",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function generateReport(req, res) {
    try {
        const { type } = req.body;
        if (type === "daily") return getDailyReport(req, res);
        if (type === "weekly") return getWeeklyReport(req, res);
        if (type === "monthly") return getMonthlyReport(req, res);

        return res.status(400).json({
            success: false,
            message: "Invalid report type",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function downloadReport(req, res) {
    try {
        const { type } = req.params;
        const reportData = { type, generatedAt: new Date(), format: "json" };

        res.setHeader("Content-Disposition", `attachment; filename=report_${type}_${Date.now()}.json`);
        res.setHeader("Content-Type", "application/json");
        return res.status(200).json(reportData);
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

module.exports = {
    getReports,
    getDailyReport,
    getWeeklyReport,
    getMonthlyReport,
    getReport,
    generateReport,
    downloadReport,
}
