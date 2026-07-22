const User = require("../models/User");
const Notification = require("../models/Notification");
const { getIO } = require("../sockets/socket");
const EVENTS = require("../sockets/socketEvents");

async function notifyAdmins(title, message) {
    try {
        const admins = await User.find({ role: { $in: ["SUPER_ADMIN", "CITY_ADMIN"] } });
        const io = getIO();
        
        for (const admin of admins) {
            const notif = await Notification.create({
                title,
                message,
                recipient: admin._id
            });
            
            if (io) {
                io.to(`user_${admin._id}`).emit(EVENTS.NEW_NOTIFICATION, notif);
            }
        }
    } catch (err) {
        console.error("Failed to notify admins:", err);
    }
}

async function notifyUser(userId, title, message) {
    try {
        const io = getIO();
        const notif = await Notification.create({
            title,
            message,
            recipient: userId
        });
        
        if (io) {
            io.to(`user_${userId}`).emit(EVENTS.NEW_NOTIFICATION, notif);
        }
    } catch (err) {
        console.error("Failed to notify user:", err);
    }
}

module.exports = { notifyAdmins, notifyUser };
