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
    },
    //account balance
    acc_balance:{
        type: Number,
        default: 1000
    },
    //transactions - array of transactions
    transactions: [{
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transaction"
        }
    }],
    //cart - array of books to be rented
    cart:[{
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book"
        }
    }],
    //delivery_address
    address: {
        type: String,
        required: true
    }
});

readerSchema.plugin(passportLocalMongoose);

const Reader = module.exports = mongoose.model("Reader", readerSchema);