const Station = require("../models/Station");
const { predictAQI } = require("../services/AiServices");

async function getPredictions(req, res) {
    try {
        const cities = await Station.distinct("city");
        const predictions = [];

        for (const city of cities) {
            const stations = await Station.find({ city, status: "ACTIVE" });
            if (stations.length === 0) continue;

            const avgAQI = Math.round(stations.reduce((sum, s) => sum + s.AQI, 0) / stations.length);
            const avgPM25 = Math.round(stations.reduce((sum, s) => sum + s.PM25, 0) / stations.length);

            const prediction = predictAQI(city, avgAQI, avgPM25);
            predictions.push({
                city,
                currentAQI: avgAQI,
                currentPM25: avgPM25,
                stationCount: stations.length,
                ...prediction,
            });
        }

        return res.status(200).json({
            success: true,
            count: predictions.length,
            predictions: predictions,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function getPrediction(req, res) {
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
        const avgPM25 = Math.round(stations.reduce((sum, s) => sum + s.PM25, 0) / stations.length);

        const prediction = predictAQI(cityName, avgAQI, avgPM25);

        return res.status(200).json({
            success: true,
            prediction: {
                city: cityName,
                currentAQI: avgAQI,
                currentPM25: avgPM25,
                stationCount: stations.length,
                stations: stations.map(s => ({ name: s.stationName, AQI: s.AQI })),
                ...prediction,
            },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function createPrediction(req, res) {
    try {
        const { city } = req.body;
        const stations = await Station.find({
            city: { $regex: new RegExp(city, "i") },
            status: "ACTIVE",
        });

        if (stations.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No stations found for ${city}`,
            });
        }

        const avgAQI = Math.round(stations.reduce((sum, s) => sum + s.AQI, 0) / stations.length);
        const avgPM25 = Math.round(stations.reduce((sum, s) => sum + s.PM25, 0) / stations.length);

        const prediction = predictAQI(city, avgAQI, avgPM25);

        return res.status(201).json({
            success: true,
            message: "Prediction generated successfully",
            prediction: {
                city,
                currentAQI: avgAQI,
                ...prediction,
            },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function updatePrediction(req, res) {
    try {
        return res.status(200).json({
            success: true,
            message: "Predictions are auto-generated from live station data",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function deletePrediction(req, res) {
    try {
        return res.status(200).json({
            success: true,
            message: "Predictions are ephemeral and generated on demand",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

module.exports = {
    getPredictions,
    getPrediction,
    createPrediction,
    updatePrediction,
    deletePrediction,
}
