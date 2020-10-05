let mongoose = require("mongoose");

let genreSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    books: [{
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book"
        },
        book_name: String
    }]
});

const Genre = module.exports = mongoose.model("Genre", genreSchema);
