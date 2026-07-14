const express = require("express")
const {
    getSources,
    getSource,
    createSource,
    updateSource,
    deleteSource,
} = require("../controllers/apiSources")

const router = express.Router();

// GET /
router.get("/", getSources)

// GET /:location
router.get("/:location", getSource)

// POST /
router.post("/", createSource)

// PUT /:id
router.put("/:id", updateSource)

// DELETE /:id
router.delete("/:id", deleteSource)

module.exports = router;
