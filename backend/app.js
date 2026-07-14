require("dotenv").config();
const express = require("express")
const {loginCheck,viewOnlyBy} = require("../middleware/auth")

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

const app = express()

app.get("/",(req,res)=>{
    return res.end("Hello from Server")
})

app.use("/api/auth",apiAuthRouter)
app.use("/api/alert",loginCheck,apiAlertRouter)
app.use("/api/assignment",loginCheck,apiAssignmentRouter)
app.use("/api/hotspot",loginCheck,apiHotspotRouter)
app.use("/api/notification",loginCheck,apiNotificationRouter)

app.use("/api/dashboard",loginCheck,apiDashboardRouter)
app.use("/api/officers",loginCheck,apiOfficersRouter)
app.use("/api/predictions",loginCheck,apiPredictionsRouter)
app.use("/api/reports",loginCheck,apiReportsRouter)
app.use("/api/sources",loginCheck,apiSourcesRouter)
app.use("/api/stations",loginCheck,apiStationsRouter)

module.exports = app