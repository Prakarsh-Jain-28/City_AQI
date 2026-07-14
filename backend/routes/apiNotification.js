const express = require("express")
const {
    getNotifications,
    getNotification,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} = require("../controllers/apiNotification")

const router = express.Router();

// GET    /
router.get("/", getNotifications)

// PUT    /read-all
router.put("/read-all", markAllAsRead)

// GET    /:id
router.get("/:id", getNotification)

// POST   /
router.post("/", createNotification)

// PUT    /:id/read
router.put("/:id/read", markAsRead)

// DELETE /:id
router.delete("/:id", deleteNotification)

module.exports = router;
