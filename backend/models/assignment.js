const { Schema, model } = require("mongoose");

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
            enum: ["PENDING", "IN_PROGRESS", "COMPLETED"],
            default: "PENDING",
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

module.exports = model("Assignment", assignmentSchema);