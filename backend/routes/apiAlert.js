const express = require("express")
const {
    getAllAlerts,
    getAlertById,
    createAlert,
    updateAlert,
    deleteAlert,
    broadcastAlert,
} = require("../controllers/apiAlert")

const router = express.Router();

// GET    /
router.get("/", getAllAlerts)

// GET    /:id
router.get("/:id", getAlertById)

// POST   /
router.post("/", createAlert)

// POST   /broadcast
router.post("/broadcast", broadcastAlert)

// PUT    /:id
router.put("/:id", updateAlert)

// DELETE /:id
router.delete("/:id", deleteAlert)

module.exports = router;
