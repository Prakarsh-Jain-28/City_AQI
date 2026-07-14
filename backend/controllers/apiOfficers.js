const User = require("../models/User");
const bcrypt = require("bcrypt");
const { notifyAdmins } = require("../utils/notifier");

async function getOfficers(req, res) {
    try {
        const filters = {};
        if (req.query.role) filters.role = req.query.role;
        if (req.query.city) filters.city = req.query.city;

        const officers = await User.find(filters).select("-password").sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            count: officers.length,
            officers: officers,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function getOfficer(req, res) {
    try {
        const officer = await User.findById(req.params.id).select("-password");
        if (!officer) {
            return res.status(404).json({
                success: false,
                message: "Officer not found",
            });
        }
        return res.status(200).json({
            success: true,
            officer: officer,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function createOfficer(req, res) {
    try {
        const { name, email, password, role, city, phone } = req.body;

        const existingUser = await User.findOne({
            $or: [{ email }, { phone }],
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email or phone already exists",
            });
        }

        const hash = await bcrypt.hash(password, Number(process.env.SALT_ROUNDS));

        const officer = await User.create({
            name,
            email,
            password: hash,
            role: role || "OFFICER",
            city,
            phone,
        });

        notifyAdmins("New Officer Registered", `Officer ${officer.name} has been added to the system in ${officer.city}.`);

        const officerResponse = officer.toObject();
        delete officerResponse.password;

        return res.status(201).json({
            success: true,
            message: "Officer created successfully",
            officer: officerResponse,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function updateOfficer(req, res) {
    try {
        const updateData = { ...req.body };
        delete updateData.password;

        const officer = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { returnDocument: 'after', runValidators: true }
        ).select("-password");

        if (!officer) {
            return res.status(404).json({
                success: false,
                message: "Officer not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Officer updated successfully",
            officer: officer,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function deleteOfficer(req, res) {
    try {
        const officer = await User.findByIdAndDelete(req.params.id);
        if (!officer) {
            return res.status(404).json({
                success: false,
                message: "Officer not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Officer deleted successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function getOfficersByZone(req, res) {
    try {
        const officers = await User.find({
            city: { $regex: new RegExp(req.params.zone, "i") },
        }).select("-password").sort({ name: 1 });

        return res.status(200).json({
            success: true,
            count: officers.length,
            officers: officers,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

module.exports = {
    getOfficers,
    getOfficer,
    createOfficer,
    updateOfficer,
    deleteOfficer,
    getOfficersByZone,
}
