let mongoose = require("mongoose");

let authorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    books: [{
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book"
        },
        book_name: String
    }]
});

const Author = module.exports = mongoose.model("Author", authorSchema);
