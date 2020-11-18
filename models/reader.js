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
        required: true,
        validate: [{
            validator: (num) => {
                return num >= 0 ;
            },
            message: "Minimum account balance is 0"
        },  {
            validator: (num) => {
                return num <=3000 ;
            },
            message: "Maximum allowed balance is 3000"
        }]
    },
    current_issues:{
        type: Number,
        default: 0
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
    }
});

readerSchema.plugin(passportLocalMongoose);

const Reader = module.exports = mongoose.model("Reader", readerSchema);