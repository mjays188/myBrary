let mongoose = require("mongoose");
let passportLocalMongoose = require("passport-local-mongoose");

let readerSchema = new mongoose.Schema({
    isAdmin: {
        type: Boolean
    },
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    verification_token:{
        type: String,
        default: ""
    },
    is_verified:{
        type: Boolean,
        default: false
    },
    forget_password_token:{
        type: String,
        default: ""
    }
});

readerSchema.plugin(passportLocalMongoose);

const Reader = module.exports = mongoose.model("Reader", readerSchema);