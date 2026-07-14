const express = require("express")
const {
    getHotspots,
    getHotspot,
    createHotspot,
    updateHotspot,
    deleteHotspot,
    getCriticalHotspots,
} = require("../controllers/apiHotspot")

const router = express.Router();

// GET    /
router.get("/", getHotspots)

// GET    /critical
router.get("/critical", getCriticalHotspots)

// GET    /:id
router.get("/:id", getHotspot)

// POST   /
router.post("/", createHotspot)

// PUT    /:id
router.put("/:id", updateHotspot)

// DELETE /:id
router.delete("/:id", deleteHotspot)

module.exports = router;
