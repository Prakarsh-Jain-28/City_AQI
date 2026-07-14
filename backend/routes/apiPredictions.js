const express = require("express")
const {
    getPredictions,
    getPrediction,
    createPrediction,
    updatePrediction,
    deletePrediction,
} = require("../controllers/apiPredictions")

const router = express.Router();

// GET    /
router.get("/", getPredictions)

// GET    /:location
router.get("/:location", getPrediction)

// POST   /
router.post("/", createPrediction)

// PUT    /:id
router.put("/:id", updatePrediction)

// DELETE /:id
router.delete("/:id", deletePrediction)

module.exports = router;
