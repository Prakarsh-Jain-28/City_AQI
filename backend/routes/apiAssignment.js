const express = require("express")
const {
    getAssignments,
    getAssignment,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getOfficerAssignments,
} = require("../controllers/apiAssignment")

const router = express.Router();

// GET    /
router.get("/", getAssignments)

// GET    /officer/:officerId
router.get("/officer/:officerId", getOfficerAssignments)

// GET    /:id
router.get("/:id", getAssignment)

// POST   /
router.post("/", createAssignment)

// PUT    /:id
router.put("/:id", updateAssignment)

// DELETE /:id
router.delete("/:id", deleteAssignment)

module.exports = router;
