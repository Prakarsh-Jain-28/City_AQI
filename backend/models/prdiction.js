const { Schema, model } = require("mongoose");

const predictionSchema = new Schema(
    {
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

        predictedAQI24: {
            type: Number,
            required: true,
        },

        predictedAQI48: {
            type: Number,
            required: true,
        },

        predictedAQI72: {
            type: Number,
            required: true,
        },

        confidence: {
            type: Number,
            min: 0,
            max: 100,
            required: true,
        },

        modelVersion: {
            type: String,
            default: "v1.0",
        },

        generatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = model("Prediction", predictionSchema);