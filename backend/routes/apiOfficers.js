const express = require("express")
const {
    getOfficers,
    getOfficer,
    createOfficer,
    updateOfficer,
    deleteOfficer,
    getOfficersByZone,
} = require("../controllers/apiOfficers")

const router = express.Router();

// GET    /
router.get("/", getOfficers)

// GET    /zone/:zone
router.get("/zone/:zone", getOfficersByZone)

// GET    /:id
router.get("/:id", getOfficer)

// POST   /
router.post("/", createOfficer)

// PUT    /:id
router.put("/:id", updateOfficer)

// DELETE /:id
router.delete("/:id", deleteOfficer)

module.exports = router;
