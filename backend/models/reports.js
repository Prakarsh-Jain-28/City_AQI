const { Schema, model } = require("mongoose");

const reportSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        city: {
            type: String,
            required: true,
            trim: true,
        },

        reportType: {
            type: String,
            enum: ["DAILY", "WEEKLY", "MONTHLY"],
            required: true,
        },

        averageAQI: {
            type: Number,
            required: true,
        },

        highestAQI: {
            type: Number,
            required: true,
        },

        lowestAQI: {
            type: Number,
            required: true,
        },

        summary: {
            type: String,
            required: true,
            trim: true,
        },

        generatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = model("Report", reportSchema);s