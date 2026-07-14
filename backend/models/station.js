const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const stationSchema = new Schema(
    {
        stationName: {
            type: String,
            required: true,
            trim: true,
        },

        city: {
            type: String,
            required: true,
            trim: true,
        },

        location: {
            type: String,
            required: true,
            trim: true,
        },

        // latitude: {
        //     type: Number,
        //     required: true,
        // },

        // longitude: {
        //     type: Number,
        //     required: true,
        // },

        AQI: {
            type: Number,
            required: true,
        },

        PM25: {
            type: Number,
            required: true,
        },

        PM10: {
            type: Number,
            required: true,
        },

        NO2: {
            type: Number,
            required: true,
        },

        SO2: {
            type: Number,
            required: true,
        },

        CO: {
            type: Number,
            required: true,
        },

        O3: {
            type: Number,
            required: true,
        },

        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE", "MAINTENANCE"],
            default: "ACTIVE",
        },

        lastUpdated: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.models.Station || model("Station", stationSchema);
