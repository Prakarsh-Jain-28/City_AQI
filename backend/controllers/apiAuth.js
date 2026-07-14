const User = require("../models/User");
const { setUser } = require("../services/auth")
const bcrypt = require("bcrypt")


async function AuthorityRegister(req, res) {
    try {
        const { name, email, password, role, city, phone } = req.body;

        const existingUser = await User.findOne({
            $or: [{ email }, { phone }],
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }

        const hash = await bcrypt.hash(password, Number(process.env.SALT_ROUNDS))

        const user = await User.create({
            name,
            email,
            password: hash,
            role,
            city,
            phone,
        });

        const userResponse = user.toObject();
        delete userResponse.password;

        return res.status(201).json({
            success: true,
            message: "Authority Registered Successfully",
            user: userResponse,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function AuthorityLogin(req, res) {
    try {
        const { email, password, phone } = req.body;

        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                message: "Provide either email or phone.",
            });
        }

        const user = await User.findOne({
            $or: [
                { email },
                { phone }
            ]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const result = await bcrypt.compare(password, user.password);

        if (!result) {
            return res.status(401).json({
                success: false,
                message: "Invalid Password",
            });
        }

        const token = setUser(user);
        res.cookie("uid", token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: "lax",
        });

        const userResponse = user.toObject();
        delete userResponse.password;

        return res.status(200).json({
            success: true,
            message: "Login Successful",
            token: token,
            user: userResponse,
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function AuthorityLogout(req, res) {
    try {
        res.clearCookie("uid");
        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function AuthorityProfile(req, res) {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        return res.status(200).json({
            success: true,
            user: user,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

async function UpdateProfile(req, res) {
    try {
        const { name, phone, city, password } = req.body;
        
        let updateData = { name, phone, city };
        if (password) {
            updateData.password = await bcrypt.hash(password, Number(process.env.SALT_ROUNDS));
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { returnDocument: 'after', runValidators: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: user,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}


module.exports = {
    AuthorityLogin,
    AuthorityRegister,
    AuthorityLogout,
    AuthorityProfile,
    UpdateProfile,
}
