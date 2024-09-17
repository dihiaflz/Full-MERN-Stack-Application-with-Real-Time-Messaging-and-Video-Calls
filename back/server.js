require("dotenv").config(); // Load environment variables from a .env file
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require('cors');
const app = express();

// Middleware setup
app.use(bodyParser.json()); // Parse incoming JSON requests
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded requests
app.use(cors({
    origin: 'http://localhost:3000' // Allow requests from this origin (React frontend)
}));

// Routes setup
const signIn = require("./routes/signIn"); // SignIn route
app.use("/signIn", signIn);

const chat = require("./routes/chat"); // Chat route
app.use("/chat", chat);

const signUp = require("./routes/signUp"); // SignUp route
app.use("/signUp", signUp);

// Database connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URI, { useNewUrlParser: true, useUnifiedTopology: true }); // Connect to MongoDB
    } catch (err) {
        console.log(err); // Log connection error
    }
};

connectDB();

mongoose.connection.once("open", () => {
    console.log("Connected to MongoDB"); // Log once MongoDB connection is successful
});

const http = require("http");
const { Server } = require("socket.io");
const authMiddlewareSocket = require("./authMiddlewareSocket"); // Middleware for socket authentication
const Message = require("./models/Messages"); // Message model

const server = http.createServer(app); // Create HTTP server
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000', // Allow socket connections from this origin
        methods: ["GET", "POST"]
    }
});

// Start the server
const PORT = process.env.PORT || 5000; // Set port from environment or default to 5000
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

io.use(authMiddlewareSocket); // Use authentication middleware for socket connections

const socketToUserMap = new Map(); // Map to store socket IDs and corresponding user IDs

// Handle socket connections
io.on('connection', (socket) => {
    console.log('User connected: ' + socket.id); // Log when a user connects

    // Handle sending messages in the chat
    socket.on('sendMessage', async (data) => {
        console.log("Received from frontend: ", data);
        const newMessage = new Message({
            senderId: socket.user._id, // Sender is the authenticated user
            receiverId: data.receiverId,
            message: data.message,
        });

        try {
            console.log(newMessage);
            await newMessage.save(); // Save message to the database
            io.emit('receiveMessage', newMessage); // Emit the saved message to all clients
        } catch (err) {
            console.error('Error saving the message:', err);
        }
    });

    // Handle user registration with socket ID for video calls
    socket.on('registerUser', (userId) => {
        socketToUserMap.set(userId, socket.id); // Map user ID to socket ID
        console.log("socketToUserMap: ", socketToUserMap);
    });

    // Function to get user ID by socket ID
    function getUserIdBySocketId(socketId) {
        for (let [userId, id] of socketToUserMap.entries()) {
            if (id === socketId) {
                return userId; // Return the user ID if found
            }
        }
        return null; // Return null if no matching socket ID is found
    }

    // Handle requests to get user ID by socket ID
    socket.on("getUserId", (socketId, callback) => {
        const userId = getUserIdBySocketId(socketId);
        if (userId) {
            callback({ success: true, userId: userId });
        } else {
            callback({ success: false, message: "User ID not found" });
        }
    });

    // Handle requests to get socket ID by user ID
    socket.on('getSocketId', (userId, callback) => {
        const socketId = socketToUserMap.get(userId);
        if (socketId) {
            callback({ socketId: socketId });
        } else {
            callback({ error: "Socket ID not found" });
        }
    });

    // Video call with not connected user handling 
    socket.on("callUserNotConnected", async (data) => {
        const newMessage = new Message({
            senderId: data.from,
            receiverId: data.userToCall,
            message: "📞 FACE CALL", // Special message indicating a video call
            type: "call"
        });

        try {
            await newMessage.save(); // Save the call event as a message in the database
            console.log("Message saved");
            io.emit('receiveMessage', newMessage); // Broadcast the saved message
        }catch{
            console.error('Error saving the call:', err);
            io.emit("callSaved", {
                success: false,
                message: "Error saving the call.",
                error: err.message
            });  
        }
    })

    // Video call handling
    socket.on("callUser", async (data) => {
        io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name });
        const newMessage = new Message({
            senderId: getUserIdBySocketId(data.from),
            receiverId: getUserIdBySocketId(data.userToCall),
            message: "📞 FACE CALL", // Special message indicating a video call
            type: "call"
        });

        try {
            await newMessage.save(); // Save the call event as a message in the database
            console.log("Message saved");
            io.emit('receiveMessage', newMessage); // Broadcast the saved message
        } catch (err) {
            console.error('Error saving the call:', err);
            io.emit("callSaved", {
                success: false,
                message: "Error saving the call.",
                error: err.message
            });
        }
    });

    // Handle call cancellation
    socket.on('callCancelled', ({ from, to }) => {
        socket.to(socketToUserMap.get(from)).emit("callCancelled"); // Notify the user who initiated the call
        socket.to(socketToUserMap.get(to)).emit("callCancelled"); // Notify the user who was called
    });

    // Handle call rejection
    socket.on('callRejected', ({ from, to }) => {
        socket.to(socketToUserMap.get(from)).emit("callRejected"); // Notify the user who initiated the call
        socket.to(socketToUserMap.get(to)).emit("callRejected"); // Notify the user who was called
    });

    // Handle answering the call
    socket.on("answerCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal); // Notify the caller that the call was accepted
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected');
        // Remove the user from the map when they disconnect
        for (let [userId, socketId] of socketToUserMap.entries()) {
            if (socketId === socket.id) {
                socketToUserMap.delete(userId); // Remove the user from the map
                console.log("Updated socketToUserMap after disconnection: ", socketToUserMap);
                break;
            }
        }
    });
});

// Fallback for non-existing routes
app.use((req, res, next) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found.'
    });
});
