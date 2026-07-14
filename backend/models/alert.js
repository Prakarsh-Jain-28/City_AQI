const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const alertSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },

        severity: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            required: true,
        },

        targetArea: {
            type: String,
            required: true,
            trim: true,
        },

        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        expiresAt: {
            type: Date,
            required: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        durationHours: {
            type: Number,
            default: 24,
        },

        advisories: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

const Alert = model("Alert", alertSchema);

module.exports = Alert;
