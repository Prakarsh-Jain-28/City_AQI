const express = require("express")
const {
    getReports,
    getDailyReport,
    getWeeklyReport,
    getMonthlyReport,
    getReport,
    generateReport,
    downloadReport,
} = require("../controllers/apiReports")

const router = express.Router();

// GET /
router.get("/", getReports)

// GET /daily
router.get("/daily", getDailyReport)

// GET /weekly
router.get("/weekly", getWeeklyReport)

// GET /monthly
router.get("/monthly", getMonthlyReport)

// POST /generate
router.post("/generate", generateReport)

// GET /download/:type
router.get("/download/:type", downloadReport)

// GET /:id
router.get("/:id", getReport)

module.exports = router;
