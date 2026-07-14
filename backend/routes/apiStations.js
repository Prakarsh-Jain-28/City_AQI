const express = require("express")
const {
    getStations,
    getStation,
    createStation,
    updateStation,
    deleteStation,
} = require("../controllers/apiStations")

const router = express.Router();

// GET    /
router.get("/", getStations)

// GET    /:id
router.get("/:id", getStation)

// POST   /
router.post("/", createStation)

// PUT    /:id
router.put("/:id", updateStation)

// DELETE /:id
router.delete("/:id", deleteStation)

module.exports = router;
