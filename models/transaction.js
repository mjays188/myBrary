let mongoose = require("mongoose");

let transactionSchema = new mongoose.Schema({
    reader:  {
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Reader"
        }
    },
    //initially the amount will be qty*500 and after the book is returned the required amount will be kept remaining will be returned 
    amount:{
        type: Number,
        required: true
    },
    status: {
        type: String,
        default: "Borrowed"
    },
    books: [{
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book"
        },
        book_name: String
    }],
    requested_weeks:[{
        type: Number
    }],
    borrow_date:{
        type: Date,
        required: true,
        default: Date.now()
    }
});

module.exports = mongoose.model("Transaction", transactionSchema);
