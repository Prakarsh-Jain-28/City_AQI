const Message = require("../models/Message");
const User = require("../models/User");
const { notifyAdmins } = require("../utils/notifier");
const { getIO } = require("../sockets/socket");
const EVENTS = require("../sockets/socketEvents");

// Get contacts available for the current user to chat with
async function getContacts(req, res) {
    try {
        const currentUser = await User.findById(req.user._id);
        
        let query = {};
        if (currentUser.role === "OFFICER") {
            // Officer can talk to SUPER_ADMIN or other officers in the same city
            query = {
                $or: [
                    { role: "SUPER_ADMIN" },
                    { role: "OFFICER", city: currentUser.city }
                ],
                _id: { $ne: currentUser._id } // exclude self
            };
        } else {
            // Admin can talk to anyone
            query = {
                _id: { $ne: currentUser._id }
            };
        }

        const contacts = await User.find(query).select("name email role city");

        // Fetch unread message count for each contact
        const contactsWithDetails = await Promise.all(contacts.map(async (contact) => {
            const unreadCount = await Message.countDocuments({
                sender: contact._id,
                receiver: currentUser._id,
                readStatus: false
            });

            // Get last message
            const lastMessage = await Message.findOne({
                $or: [
                    { sender: currentUser._id, receiver: contact._id },
                    { sender: contact._id, receiver: currentUser._id }
                ]
            }).sort({ createdAt: -1 });

            return {
                ...contact.toObject(),
                unreadCount,
                lastMessage: lastMessage ? lastMessage.content : null,
                lastMessageTime: lastMessage ? lastMessage.createdAt : null
            };
        }));

        // Sort by most recent message first
        contactsWithDetails.sort((a, b) => {
            if (!a.lastMessageTime) return 1;
            if (!b.lastMessageTime) return -1;
            return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
        });

        return res.status(200).json({
            success: true,
            contacts: contactsWithDetails
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Get messages between current user and a selected user
async function getMessages(req, res) {
    try {
        const { contactId } = req.params;
        const currentUserId = req.user._id;

        const messages = await Message.find({
            $or: [
                { sender: currentUserId, receiver: contactId },
                { sender: contactId, receiver: currentUserId }
            ]
        }).sort({ createdAt: 1 });

        return res.status(200).json({
            success: true,
            messages
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Send a message
async function sendMessage(req, res) {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user._id;

        if (!receiverId || !content) {
            return res.status(400).json({ success: false, message: "Receiver and content are required" });
        }

        const message = await Message.create({
            sender: senderId,
            receiver: receiverId,
            content
        });

        const io = getIO();
        if (io) {
            io.to(`user_${receiverId}`).emit(EVENTS.NEW_MESSAGE, message);
        }

        const sender = await User.findById(senderId);
        notifyAdmins("New Message Received", `New message received from ${sender ? sender.name : 'an officer'}.`);

        return res.status(201).json({
            success: true,
            message
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Mark messages as read
async function markAsRead(req, res) {
    try {
        const { contactId } = req.body;
        const currentUserId = req.user._id;

        await Message.updateMany(
            { sender: contactId, receiver: currentUserId, readStatus: false },
            { $set: { readStatus: true } }
        );

        return res.status(200).json({ success: true, message: "Messages marked as read" });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getContacts,
    getMessages,
    sendMessage,
    markAsRead
};
