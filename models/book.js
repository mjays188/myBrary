let mongoose = require("mongoose");

let bookSchema = new mongoose.Schema({
    isbn: {
        type: String,
        required: true,
        unique: true,
        validate: [{
            validator: (num) => {
                let valid = true;
                let sum = 0;
                if(num.length === 10) {
                    for(let i=0; i< num.length; i++) {
                        if(isNaN(parseInt(num[i]))){
                            valid = false;
                            break;
                        }
                        sum = sum + (10-i)*parseInt(num[i]);
                    }
                    valid = (sum%11 === 0) ? true : false;
                } else if(num.length === 13) {
                    for(let i=0; i< num.length; i++) {
                        if(isNaN(parseInt(num[i]))){
                            valid = false;
                            break;
                        }
                        if(i&1) {
                            sum = sum + parseInt(num[i])*3;
                        } else {
                            sum = sum + parseInt(num[i]);
                        }
                    }
                    valid = (sum%10 === 0) ? true : false;
                } else {
                    valid = false;
                }
                return valid;
            },
            message: "Invalid ISBN"
        }]
    },
    name: {
        type: String,
        required: true
    }, 
    authors: [{
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Author"
        },
        author_name: String
    }],
    genres: [{
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Genre"
        },
        genre_name: String
    }],
    publishDate: {
        type: Date,
        required: true
    },
    quantity: {
        type: Number,
        default: 0,
        validate: [{
            validator: (num) => {
                return num >= 0 ;
            },
            message: "Minimum allowed quantity is 0"
        },  {
            validator: (num) => {
                return num <=100 ;
            },
            message: "Maximum allowed quantity is 100"
        }]
    },
    totalIssues: {
        type: Number,
        default: 0
    }
});

const Book = module.exports = mongoose.model("Book", bookSchema);