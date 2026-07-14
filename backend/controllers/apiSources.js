const Station = require("../models/Station");
const Hotspot = require("../models/Hotspot");
const { sourceAttribution } = require("../services/AiServices");

async function getSources(req, res) {
    try {
        const cities = await Station.distinct("city");
        const sourcesData = [];

        for (const city of cities) {
            const stations = await Station.find({ city, status: "ACTIVE" });
            if (stations.length === 0) continue;

            const avgAQI = Math.round(stations.reduce((sum, s) => sum + s.AQI, 0) / stations.length);
            const avgNO2 = Math.round(stations.reduce((sum, s) => sum + s.NO2, 0) / stations.length);
            const avgPM25 = Math.round(stations.reduce((sum, s) => sum + s.PM25, 0) / stations.length);
            const avgPM10 = Math.round(stations.reduce((sum, s) => sum + s.PM10, 0) / stations.length);

            const attribution = sourceAttribution(city, avgAQI, avgNO2, avgPM25, avgPM10);
            sourcesData.push({
                city,
                avgAQI,
                ...attribution,
            });
        }

        return res.status(200).json({
            success: true,
            count: sourcesData.length,
            sources: sourcesData,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function getSource(req, res) {
    try {
        const cityName = req.params.location;
        const stations = await Station.find({
            city: { $regex: new RegExp(cityName, "i") },
            status: "ACTIVE",
        });

        if (stations.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No stations found for ${cityName}`,
            });
        }

        const avgAQI = Math.round(stations.reduce((sum, s) => sum + s.AQI, 0) / stations.length);
        const avgNO2 = Math.round(stations.reduce((sum, s) => sum + s.NO2, 0) / stations.length);
        const avgPM25 = Math.round(stations.reduce((sum, s) => sum + s.PM25, 0) / stations.length);
        const avgPM10 = Math.round(stations.reduce((sum, s) => sum + s.PM10, 0) / stations.length);

        const hotspots = await Hotspot.find({
            location: { $regex: new RegExp(cityName, "i") },
            status: { $ne: "RESOLVED" },
        });

        const attribution = sourceAttribution(cityName, avgAQI, avgNO2, avgPM25, avgPM10);

        return res.status(200).json({
            success: true,
            source: {
                city: cityName,
                avgAQI,
                hotspotCount: hotspots.length,
                hotspotSources: hotspots.map(h => h.source),
                ...attribution,
            },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function createSource(req, res) {
    return res.status(200).json({
        success: true,
        message: "Source attribution is auto-generated from station data",
    });
}

async function updateSource(req, res) {
    return res.status(200).json({
        success: true,
        message: "Source attribution is auto-generated from station data",
    });
}

async function deleteSource(req, res) {
    return res.status(200).json({
        success: true,
        message: "Source attribution is auto-generated from station data",
    });
}

module.exports = {
    getSources,
    getSource,
    createSource,
    updateSource,
    deleteSource,
}
