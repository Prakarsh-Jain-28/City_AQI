const { Server } = require("socket.io");
const EVENTS = require("./socketEvents");

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
            credentials: true,
        }
    });

    io.on("connection", (socket) => {

        // Join admin room
        socket.on("joinAdmin", () => {
            socket.join("admin");
        });

        // Join city-specific room
        socket.on("joinCity", (city) => {
            socket.join(`city_${city}`);
        });

        // Join user-specific room
        socket.on("joinUser", (userId) => {
            socket.join(`user_${userId}`);
        });

        socket.on("disconnect", () => {
        });

    });

    return io;
};

const getIO = () => io;

module.exports = {
    initSocket,
    getIO
};
