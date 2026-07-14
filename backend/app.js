require("dotenv").config();
const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const mongoose = require("mongoose")
const { loginCheck, viewOnlyBy } = require("./middleware/auth")
const logReqRes = require("./middleware/logger")
const errorHandler = require("./middleware/errorHandling")

const apiAuthRouter = require("./routes/apiAuth")
const apiAlertRouter = require("./routes/apiAlert")
const apiAssignmentRouter = require("./routes/apiAssignment")
const apiHotspotRouter = require("./routes/apiHotspot")
const apiNotificationRouter = require("./routes/apiNotification")
const apiDashboardRouter = require("./routes/apiDashboard")
const apiOfficersRouter = require("./routes/apiOfficers")
const apiPredictionsRouter = require("./routes/apiPredictions")
const apiReportsRouter = require("./routes/apiReports")
const apiSourcesRouter = require("./routes/apiSources")
const apiStationsRouter = require("./routes/apiStations")
const apiPublicRouter = require("./routes/apiPublic")
const apiMessagesRouter = require("./routes/apiMessages")

const app = express()

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URL)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.log("MongoDB Connection Error:", err.message))

// Middleware
app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(logReqRes("log.txt"));

app.get("/", (req, res) => {
    return res.json({ message: "CityAQI API Server Running" })
})

// Public Routes (No Auth Required - Citizen Portal)
app.use("/api/public", apiPublicRouter)

// Auth Routes
app.use("/api/auth", apiAuthRouter)

// Protected Routes (Admin Dashboard - Auth Required)
app.use("/api/alert", loginCheck, apiAlertRouter)
app.use("/api/assignment", loginCheck, apiAssignmentRouter)
app.use("/api/hotspot", loginCheck, apiHotspotRouter)
app.use("/api/notification", loginCheck, apiNotificationRouter)
app.use("/api/dashboard", loginCheck, apiDashboardRouter)
app.use("/api/officers", loginCheck, apiOfficersRouter)
app.use("/api/predictions", loginCheck, apiPredictionsRouter)
app.use("/api/reports", loginCheck, apiReportsRouter)
app.use("/api/sources", loginCheck, apiSourcesRouter)
app.use("/api/stations", loginCheck, apiStationsRouter)
app.use("/api/messages", loginCheck, apiMessagesRouter)

// Error Handling Middleware
app.use(errorHandler)

module.exports = app
