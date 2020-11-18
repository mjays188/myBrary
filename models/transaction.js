let mongoose = require("mongoose");

let transactionSchema = new mongoose.Schema({
    reader:  {
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Reader"
        }
    },
    status: {
        type: String,
        default: "Borrowed"
    },
    book: {
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book"
        }
    },
    duration:{
        type: Number
    },
    borrow_date:{
        type: Date,
        default: Date.now()
    },
    revenue:{
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model("Transaction", transactionSchema);
