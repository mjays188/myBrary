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
    password: {
        type: String
    }
});

readerSchema.plugin(passportLocalMongoose);

const Reader = module.exports = mongoose.model("Reader", readerSchema);