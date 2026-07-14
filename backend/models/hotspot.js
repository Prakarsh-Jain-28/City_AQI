const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const hotspotSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        location: {
            type: String,
            required: true,
            trim: true,
        },

        latitude: {
            type: Number,
            required: true,
        },

        longitude: {
            type: Number,
            required: true,
        },

        aqi: {
            type: Number,
            required: true,
        },

        severity: {
            type: String,
            enum: ["LOW", "MODERATE", "HIGH", "VERY_HIGH", "SEVERE"],
            required: true,
        },

        source: {
            type: String,
            enum: [
                "TRAFFIC",
                "CONSTRUCTION",
                "INDUSTRY",
                "WASTE_BURNING",
                "MIXED",
                "UNKNOWN",
            ],
            default: "UNKNOWN",
        },

        recommendation: {
            type: String,
            trim: true,
        },

        status: {
            type: String,
            enum: ["ACTIVE", "ASSIGNED", "RESOLVED"],
            default: "ACTIVE",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.models.Hotspot || model("Hotspot", hotspotSchema);
