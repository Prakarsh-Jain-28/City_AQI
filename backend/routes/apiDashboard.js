const express = require("express")
const {
    getDashboard,
    getDashboardSummary,
} = require("../controllers/apiDashboard")

const router = express.Router();

// GET /
router.get("/", getDashboard)

// GET /summary
router.get("/summary", getDashboardSummary)

module.exports = router;
