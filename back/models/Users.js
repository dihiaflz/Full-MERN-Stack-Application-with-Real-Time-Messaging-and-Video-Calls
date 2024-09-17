const mongoose = require("mongoose")

const usersSchema = new mongoose.Schema({
    email : {
        type : String,
        required : true
    },
    password : {
        type : String,
        required : true
    }
}, { collection : "utilisateurs"}
)

module.exports = mongoose.model("utilisateurs", usersSchema)