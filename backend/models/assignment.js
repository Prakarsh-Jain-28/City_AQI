const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const assignmentSchema = new Schema(
    {
        officer: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        hotspotId: {
            type: Schema.Types.ObjectId,
            ref: "Hotspot",
            required: true,
        },

        priority: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            required: true,
        },

        status: {
            type: String,
            enum: ["PENDING", "IN_PROGRESS", "PENDING_VERIFICATION", "COMPLETED"],
            default: "PENDING",
        },

        summary: {
            type: String,
        },

        assignedAt: {
            type: Date,
            default: Date.now,
        },

        completedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.models.Assignment || model("Assignment", assignmentSchema);
