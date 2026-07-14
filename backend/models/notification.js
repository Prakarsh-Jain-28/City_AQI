const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const notificationSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        message: {
            type: String,
            required: true,
            trim: true,
        },

        recipient: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.models.Notification || model("Notification", notificationSchema);
