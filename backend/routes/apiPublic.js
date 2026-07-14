const express = require("express")
const Station = require("../models/Station")
const Alert = require("../models/Alert")
const Hotspot = require("../models/Hotspot")
const { predictAQI, sourceAttribution, healthRisk } = require("../services/AiServices")

const router = express.Router();

// GET /api/public/cities — List of cities with aggregate AQI
router.get("/cities", async (req, res) => {
    try {
        const cityData = await Station.aggregate([
            { $match: { status: "ACTIVE" } },
            {
                $group: {
                    _id: "$city",
                    avgAQI: { $avg: "$AQI" },
                    maxAQI: { $max: "$AQI" },
                    avgPM25: { $avg: "$PM25" },
                    avgPM10: { $avg: "$PM10" },
                    avgNO2: { $avg: "$NO2" },
                    avgSO2: { $avg: "$SO2" },
                    avgCO: { $avg: "$CO" },
                    avgO3: { $avg: "$O3" },
                    stationCount: { $sum: 1 },
                }
            },
            { $sort: { avgAQI: -1 } }
        ]);

        const cities = cityData.map(c => ({
            city: c._id,
            avgAQI: Math.round(c.avgAQI),
            maxAQI: Math.round(c.maxAQI),
            avgPM25: Math.round(c.avgPM25),
            avgPM10: Math.round(c.avgPM10),
            avgNO2: Math.round(c.avgNO2),
            avgSO2: Math.round(c.avgSO2),
            avgCO: Math.round(c.avgCO),
            avgO3: Math.round(c.avgO3),
            stationCount: c.stationCount,
        }));

        return res.status(200).json({
            success: true,
            count: cities.length,
            cities: cities,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
});

// GET /api/public/cities/:city — Detailed city data
router.get("/cities/:city", async (req, res) => {
    try {
        const cityName = req.params.city;
        const stations = await Station.find({
            city: { $regex: new RegExp(`^${cityName}$`, "i") },
            status: "ACTIVE",
        });

        if (stations.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No stations found for ${cityName}`,
            });
        }

        const avgAQI = Math.round(stations.reduce((sum, s) => sum + s.AQI, 0) / stations.length);
        const avgPM25 = Math.round(stations.reduce((sum, s) => sum + s.PM25, 0) / stations.length);
        const avgPM10 = Math.round(stations.reduce((sum, s) => sum + s.PM10, 0) / stations.length);
        const avgNO2 = Math.round(stations.reduce((sum, s) => sum + s.NO2, 0) / stations.length);
        const avgSO2 = Math.round(stations.reduce((sum, s) => sum + s.SO2, 0) / stations.length);
        const avgCO = Math.round(stations.reduce((sum, s) => sum + s.CO, 0) / stations.length);
        const avgO3 = Math.round(stations.reduce((sum, s) => sum + s.O3, 0) / stations.length);

        const prediction = predictAQI(cityName, avgAQI, avgPM25);
        const attribution = sourceAttribution(cityName, avgAQI, avgNO2, avgPM25, avgPM10);
        const health = healthRisk(avgAQI);

        const hotspots = await Hotspot.find({
            location: { $regex: new RegExp(cityName, "i") },
            status: { $ne: "RESOLVED" },
        });

        return res.status(200).json({
            success: true,
            city: {
                name: cityName,
                avgAQI,
                pollutants: { PM25: avgPM25, PM10: avgPM10, NO2: avgNO2, SO2: avgSO2, CO: avgCO, O3: avgO3 },
                stations: stations,
                prediction,
                attribution,
                healthAdvisory: health,
                hotspots: hotspots,
            },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
});

// GET /api/public/cities/:city/history — Historical AQI (simulated from current data)
router.get("/cities/:city/history", async (req, res) => {
    try {
        const cityName = req.params.city;
        const stations = await Station.find({
            city: { $regex: new RegExp(`^${cityName}$`, "i") },
            status: "ACTIVE",
        });

        if (stations.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No stations found for ${cityName}`,
            });
        }

        const avgAQI = Math.round(stations.reduce((sum, s) => sum + s.AQI, 0) / stations.length);

        const now = new Date();
        const history24h = Array.from({ length: 24 }, (_, i) => {
            const time = new Date(now - (23 - i) * 60 * 60 * 1000);
            const variation = Math.sin((i / 24) * Math.PI * 2) * 30 + (Math.random() - 0.5) * 20;
            return {
                timestamp: time.toISOString(),
                AQI: Math.max(10, Math.round(avgAQI + variation)),
            };
        });

        const historyWeekly = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(now - (6 - i) * 24 * 60 * 60 * 1000);
            const variation = (Math.random() - 0.5) * 50;
            return {
                date: date.toISOString().split("T")[0],
                avgAQI: Math.max(10, Math.round(avgAQI + variation)),
            };
        });

        const historyMonthly = Array.from({ length: 30 }, (_, i) => {
            const date = new Date(now - (29 - i) * 24 * 60 * 60 * 1000);
            const variation = Math.sin((i / 30) * Math.PI * 2) * 40 + (Math.random() - 0.5) * 30;
            return {
                date: date.toISOString().split("T")[0],
                avgAQI: Math.max(10, Math.round(avgAQI + variation)),
            };
        });

        return res.status(200).json({
            success: true,
            city: cityName,
            history: {
                hourly: history24h,
                weekly: historyWeekly,
                monthly: historyMonthly,
            },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
});

// GET /api/public/stations — All stations
router.get("/stations", async (req, res) => {
    try {
        const filters = {};
        if (req.query.city) filters.city = { $regex: new RegExp(req.query.city, "i") };

        const stations = await Station.find(filters).sort({ city: 1, stationName: 1 });
        return res.status(200).json({
            success: true,
            count: stations.length,
            stations: stations,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
});

// GET /api/public/alerts/active — Active public alerts
router.get("/alerts/active", async (req, res) => {
    try {
        const alerts = await Alert.find({ isActive: true })
            .populate("createdBy", "name role")
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
});

// GET /api/public/alerts — All public alerts
router.get("/alerts", async (req, res) => {
    try {
        const alerts = await Alert.find()
            .populate("createdBy", "name role")
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
});

// GET /api/public/predictions/:city — Forecasts for a city
router.get("/predictions/:city", async (req, res) => {
    try {
        const cityName = req.params.city;
        const stations = await Station.find({
            city: { $regex: new RegExp(`^${cityName}$`, "i") },
            status: "ACTIVE",
        });

        if (stations.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No stations found for ${cityName}`,
            });
        }

        const avgAQI = Math.round(stations.reduce((sum, s) => sum + s.AQI, 0) / stations.length);
        const avgPM25 = Math.round(stations.reduce((sum, s) => sum + s.PM25, 0) / stations.length);
        const prediction = predictAQI(cityName, avgAQI, avgPM25);

        return res.status(200).json({
            success: true,
            city: cityName,
            currentAQI: avgAQI,
            prediction,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
});

// GET /api/public/compare?city1=X&city2=Y — Compare two cities
router.get("/compare", async (req, res) => {
    try {
        const { city1, city2 } = req.query;

        if (!city1 || !city2) {
            return res.status(400).json({
                success: false,
                message: "Provide city1 and city2 query parameters",
            });
        }

        const getCityData = async (cityName) => {
            const stations = await Station.find({
                city: { $regex: new RegExp(`^${cityName}$`, "i") },
                status: "ACTIVE",
            });

            if (stations.length === 0) return null;

            const avgAQI = Math.round(stations.reduce((sum, s) => sum + s.AQI, 0) / stations.length);
            const avgPM25 = Math.round(stations.reduce((sum, s) => sum + s.PM25, 0) / stations.length);
            const avgPM10 = Math.round(stations.reduce((sum, s) => sum + s.PM10, 0) / stations.length);
            const avgNO2 = Math.round(stations.reduce((sum, s) => sum + s.NO2, 0) / stations.length);
            const avgSO2 = Math.round(stations.reduce((sum, s) => sum + s.SO2, 0) / stations.length);
            const avgCO = Math.round(stations.reduce((sum, s) => sum + s.CO, 0) / stations.length);
            const avgO3 = Math.round(stations.reduce((sum, s) => sum + s.O3, 0) / stations.length);

            const prediction = predictAQI(cityName, avgAQI, avgPM25);
            const health = healthRisk(avgAQI);

            return {
                city: cityName,
                avgAQI,
                pollutants: { PM25: avgPM25, PM10: avgPM10, NO2: avgNO2, SO2: avgSO2, CO: avgCO, O3: avgO3 },
                stationCount: stations.length,
                prediction,
                healthAdvisory: health,
            };
        };

        const data1 = await getCityData(city1);
        const data2 = await getCityData(city2);

        if (!data1 || !data2) {
            return res.status(404).json({
                success: false,
                message: `Data not available for one or both cities`,
            });
        }

        const healthier = data1.avgAQI <= data2.avgAQI ? city1 : city2;
        const aqiDiff = Math.abs(data1.avgAQI - data2.avgAQI);

        return res.status(200).json({
            success: true,
            comparison: {
                city1: data1,
                city2: data2,
                healthierCity: healthier,
                aqiDifference: aqiDiff,
                summary: `${healthier} has better air quality with ${aqiDiff} AQI points difference. ${data1.avgAQI > 200 || data2.avgAQI > 200 ? "Both cities need immediate air quality intervention." : ""}`,
            },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
});

// GET /api/public/health-advisory — Health recommendations by AQI
router.get("/health-advisory", async (req, res) => {
    try {
        const aqiLevels = [
            { range: "0-50", category: "Good", ...healthRisk(30) },
            { range: "51-100", category: "Satisfactory", ...healthRisk(75) },
            { range: "101-200", category: "Moderate", ...healthRisk(150) },
            { range: "201-300", category: "Poor", ...healthRisk(250) },
            { range: "301-400", category: "Very Poor", ...healthRisk(350) },
            { range: "401-500", category: "Severe", ...healthRisk(450) },
        ];

        return res.status(200).json({
            success: true,
            advisories: aqiLevels,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
});

module.exports = router;
