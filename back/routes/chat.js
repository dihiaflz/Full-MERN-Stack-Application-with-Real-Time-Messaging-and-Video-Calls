const express = require("express");
const chatRouter = express.Router();
const Users = require("../models/Users");
const authMiddleware = require("../authMiddleware");
const Messages = require("../models/Messages");

// Route to get all users except the currently logged-in user
chatRouter.get("/", authMiddleware, async (req, res) => {
    try {
        // Find all users excluding the current user
        const users = await Users.find({ _id: { $ne: req.user._id } });
        if (users.length === 0) {
            console.log("No other users currently exist");
            res.status(200).send({ "response": "No other users currently exist", "data": "" });
        } else {
            res.status(200).send({ "response": "success", "data": users });
        }
    } catch {
        console.log("Error getting all users");
        res.status(500).send({ "error": "Error getting all users" });
    }
});

// Route to get conversation messages with a specific user (POST request with user ID)
chatRouter.post("/messages", authMiddleware, async (req, res) => {
    try {
        console.log("Entering /messages POST route");
        // Find messages between the current user and the specified user
        const conversation = await Messages.find({
            $or: [
                { senderId: req.body.id, receiverId: req.user._id },
                { senderId: req.user._id, receiverId: req.body.id }
            ]
        });
        if (conversation.length === 0) {
            console.log("No messages found");
            res.status(200).send({ "response": "No messages found", "data": [] });
        } else {
            console.log("Success retrieving messages");
            res.status(200).send({ "response": "success", "data": conversation });
        }
    } catch {
        console.log("Error getting messages");
        res.status(500).send({ "error": "Error getting messages" });
    }
});

// Route to get unseen messages count per sender
chatRouter.get("/unseen", authMiddleware, async (req, res) => {
    try {
        const receiverId = req.user._id; // Get user ID from the token
        // Aggregate unseen messages count by sender
        const unseenMessages = await Messages.aggregate([
            { $match: { receiverId: receiverId, seen: false } },
            { $group: { _id: '$senderId', count: { $sum: 1 } } },
            { $project: { _id: 0, senderId: '$_id', nbrMessagesUnseen: '$count' } }
        ]);
        console.log(unseenMessages);
        res.status(200).json(unseenMessages);
    } catch {
        console.log("Error getting unseen messages");
        res.status(500).send({ "error": "Error getting unseen messages" });
    }
});

// Route to mark messages as seen (POST request with user ID)
chatRouter.post("/unseen", authMiddleware, async (req, res) => {
    try {
        // Update messages between the current user and the specified user to marked as seen
        await Messages.updateMany(
            { senderId: req.body.id, receiverId: req.user._id },
            { $set: { seen: true } }
        );
        console.log("Successfully updated messages to seen");
        res.status(200).send({ "response": "success" });
    } catch {
        console.log("Error updating messages to seen");
        res.status(500).send({ "error": "Error updating messages to seen" });
    }
});

module.exports = chatRouter;
