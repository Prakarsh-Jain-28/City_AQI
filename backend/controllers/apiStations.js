const Station = require("../models/Station");
const { notifyAdmins } = require("../utils/notifier");
const { getIO } = require("../sockets/socket");
const EVENTS = require("../sockets/socketEvents");

async function getStations(req, res) {
    try {
        const filters = {};
        if (req.query.city) filters.city = req.query.city;
        if (req.query.status) filters.status = req.query.status;

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
}

async function getStation(req, res) {
    try {
        const station = await Station.findById(req.params.id);
        if (!station) {
            return res.status(404).json({
                success: false,
                message: "Station not found",
            });
        }
        return res.status(200).json({
            success: true,
            station: station,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function createStation(req, res) {
    try {
        const { stationName, city, location, AQI, PM25, PM10, NO2, SO2, CO, O3 } = req.body;
        const station = await Station.create({
            stationName,
            city,
            location,
            AQI,
            PM25,
            PM10,
            NO2,
            SO2,
            CO,
            O3,
        });

        const io = getIO();
        if (io) {
            io.emit(EVENTS.STATION_UPDATE, station);
        }

        notifyAdmins("New Station Deployed", `A new monitoring station has been deployed at ${station.location}, ${station.city}.`);

        return res.status(201).json({
            success: true,
            message: "Station created successfully",
            station: station,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function updateStation(req, res) {
    try {
        const updateData = { ...req.body, lastUpdated: new Date() };

        const station = await Station.findByIdAndUpdate(
            req.params.id,
            updateData,
            { returnDocument: 'after', runValidators: true }
        );

        if (!station) {
            return res.status(404).json({
                success: false,
                message: "Station not found",
            });
        }

        const io = getIO();
        if (io) {
            io.emit(EVENTS.STATION_UPDATE, station);
            io.emit(EVENTS.AQI_UPDATE, { city: station.city, station });
        }

        return res.status(200).json({
            success: true,
            message: "Station updated successfully",
            station: station,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function deleteStation(req, res) {
    try {
        const station = await Station.findByIdAndDelete(req.params.id);
        if (!station) {
            return res.status(404).json({
                success: false,
                message: "Station not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Station deleted successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

module.exports = {
    getStations,
    getStation,
    createStation,
    updateStation,
    deleteStation,
}
