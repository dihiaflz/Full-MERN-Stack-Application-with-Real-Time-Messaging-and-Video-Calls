const { values } = require('lodash');
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: { 
        type: String, 
        required: true 
    },
    receiverId: { 
        type: String, 
        required: true 
    },
    message: { 
        type: String,
        required: true 
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    },
    seen : {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        values: ["call", "msg"],
        default: "msg"
    }
});

module.exports = mongoose.model('Message', messageSchema);