const Assignment = require("../models/Assignment");
const { notifyAdmins, notifyUser } = require("../utils/notifier");
const Hotspot = require("../models/Hotspot");
const { getIO } = require("../sockets/socket");
const EVENTS = require("../sockets/socketEvents");

async function getAssignments(req, res) {
    try {
        const assignments = await Assignment.find()
            .populate("officer", "name email phone city role")
            .populate("hotspotId", "name location severity aqi status")
            .sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            count: assignments.length,
            assignments: assignments,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function getAssignment(req, res) {
    try {
        const assignment = await Assignment.findById(req.params.id)
            .populate("officer", "name email phone city role")
            .populate("hotspotId", "name location severity aqi status");
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found",
            });
        }
        return res.status(200).json({
            success: true,
            assignment: assignment,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function createAssignment(req, res) {
    try {
        const { officer, hotspotId, priority } = req.body;

        const assignment = await Assignment.create({
            officer,
            hotspotId,
            priority,
        });

        await Hotspot.findByIdAndUpdate(hotspotId, { status: "ASSIGNED" });

        const populatedAssignment = await Assignment.findById(assignment._id)
            .populate("officer", "name email phone city role")
            .populate("hotspotId", "name location severity aqi status");

        await notifyUser(
            officer,
            "New Assignment Dispatch",
            `You have been assigned to handle hotspot: ${populatedAssignment.hotspotId.name} at ${populatedAssignment.hotspotId.location}.`
        );

        const io = getIO();
        if (io) {
            io.emit(EVENTS.NEW_ASSIGNMENT, populatedAssignment);
        }

        return res.status(201).json({
            success: true,
            message: "Assignment created successfully",
            assignment: populatedAssignment,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function updateAssignment(req, res) {
    try {
        const { status } = req.body;

        const updateData = { ...req.body };
        if (status) {
            updateData.status = status;
            if (status === "IN_PROGRESS") {
                updateData.startedAt = new Date();
                notifyAdmins("Assignment In Progress", `Assignment for hotspot is now in progress.`);
            }
            if (status === "PENDING_VERIFICATION") {
                notifyAdmins("Verification Required", `An officer has submitted an assignment summary for verification.`);
            }
            if (status === "COMPLETED") {
                updateData.completedAt = new Date();
                notifyAdmins("Assignment Completed", `Assignment for hotspot has been verified and completed.`);
            }
        }

        const assignment = await Assignment.findByIdAndUpdate(
            req.params.id,
            updateData,
            { returnDocument: 'after', runValidators: true }
        )
            .populate("officer", "name email phone city role")
            .populate("hotspotId", "name location severity aqi status");

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found",
            });
        }

        if (status === "COMPLETED") {
            await Hotspot.findByIdAndUpdate(assignment.hotspotId._id, { status: "RESOLVED" });
            await notifyUser(
                assignment.officer._id || assignment.officer,
                "Assignment Completed & Verified",
                `Your dispatch for hotspot: ${assignment.hotspotId?.name || "Hotspot"} has been verified and completed.`
            );
        }

        const io = getIO();
        if (io) {
            io.emit(EVENTS.NEW_ASSIGNMENT, { type: "UPDATE", assignment });
        }

        return res.status(200).json({
            success: true,
            message: "Assignment updated successfully",
            assignment: assignment,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function deleteAssignment(req, res) {
    try {
        const assignment = await Assignment.findByIdAndDelete(req.params.id);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Assignment deleted successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function getOfficerAssignments(req, res) {
    try {
        const assignments = await Assignment.find({ officer: req.params.officerId })
            .populate("officer", "name email phone city role")
            .populate("hotspotId", "name location severity aqi status")
            .sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            count: assignments.length,
            assignments: assignments,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

module.exports = {
    getAssignments,
    getAssignment,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getOfficerAssignments,
}
