const express = require("express");
const { getContacts, getMessages, sendMessage, markAsRead } = require("../controllers/apiMessages");

const router = express.Router();

router.get("/contacts", getContacts);
router.get("/:contactId", getMessages);
router.post("/", sendMessage);
router.put("/read", markAsRead);

module.exports = router;
