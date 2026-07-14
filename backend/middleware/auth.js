const { getUser } = require("../services/auth")

async function loginCheck(req, res, next) {
    const token = req.cookies?.uid;
    const user = getUser(token);
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required. Please login.",
        })
    }
    req.user = user;
    next();
}

function viewOnlyBy(roles = []) {
    return function (req, res, next) {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please login.",
            })
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized. Insufficient permissions.",
            })
        }

        next();
    }
}

module.exports = { loginCheck, viewOnlyBy }
