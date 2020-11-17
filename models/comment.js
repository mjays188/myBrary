let mongoose = require("mongoose");
let commentSchema = new mongoose.Schema({
    text: String,
    author: {
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Reader"
        },
        authorName: String
    }
});

module.exports = mongoose.model("Comment", commentSchema);