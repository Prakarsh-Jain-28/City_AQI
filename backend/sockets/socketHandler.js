const EVENTS = require("./socketEvents");

function socketHandler(io) {

    io.on("connection", (socket) => {

        // Join user's personal room for notifications
        socket.on("joinUser", (userId) => {
            socket.join(`user_${userId}`);
        });

        // Join admin broadcast room
        socket.on("joinAdmin", () => {
            socket.join("admin");
        });

        // Join city room for city-specific updates
        socket.on("joinCity", (city) => {
            socket.join(`city_${city}`);
        });

        // Handle station data update
        socket.on(EVENTS.STATION_UPDATE, (data) => {
            io.to("admin").emit(EVENTS.STATION_UPDATE, data);
            if (data.city) {
                io.to(`city_${data.city}`).emit(EVENTS.AQI_UPDATE, data);
            }
        });

        // Handle disconnect
        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);
        });

    });

}

module.exports = socketHandler;
