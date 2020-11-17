let express = require("express");
let router = express.Router();
let passport = require("passport");
let Book = require("../models/book");
let Author = require("../models/author");
let Genre = require("../models/genre");
let Comment = require("../models/comment");
let {isAdmin} = require("../middleware");

//Display all Books - (everyone)
router.get("/", (req, res) => {
    async function getAllBooks() {
        return await Book.find({});
    }
    getAllBooks().then(allBooks => {
        res.render("books/index", {books: allBooks});
    }).catch(err => console.log(err));
});

//search results
router.get("/search/:data/:type", (req, res) => {
    (async ()=>{
        try {
            const { data, type } = req.params;
            if(data && type){
                switch(type){
                    case "book_name":
                        const books = await Book.find({name: new RegExp(req.params.data, "i")});
                        if(books){
                            res.render("books/index", {books});
                        }else throw new Error();
                        break;
                    case "book_ISBN":
                        const book = await Book.findOne({isbn: parseInt(data)});
                        if(book){
                            res.redirect("http://localhost:3000/books/"+book._id);
                        }else throw new Error();
                        break;
                    case "pushlish_date":
                        const booksPushlished = await Book.find({publishDate: { $gte: Date.parse(data)}});
                        if(booksPushlished){
                            res.render("books/index", {books: booksPushlished});
                        }else throw new Error();
                        break;
                }
            }
        } catch (err) {
            req.flash("error", "Oops! No books found in the store");
            res.redirect("/authors");
        }
    })();
});

//Add a new book - (admin)
// - get the form for adding a new book
router.get("/new", isAdmin, (req, res) => {
    res.render("books/new");
});

// - add the book to the database after validation
router.post("/new", isAdmin, (req, res) => {
    async function createNewBook() {
        let {isbn, name, authors, genres, publishDate, quantity} = req.body;
        let authorObjects = new Array();
        for(let i=0; i<authors.length; i++){
            if(authors[i].length > 0){
                const foundAuthor = await Author.findOne({name: authors[i]});//, (err, foundAuthor) => {
                if(!foundAuthor){
                    const createdAuthor = await Author.create({name: authors[i]});
                    authorObjects.push(createdAuthor);
                } else {
                    authorObjects.push(foundAuthor);
                }
            }
        }
        authors = authorObjects;
        let genreObjects = new Array();
        for(let i=0; i<genres.length; i++){
            if(genres[i].length > 0){
                const foundGenre = await Genre.findOne({name: genres[i]});//, (err, foundAuthor) => {
                if(!foundGenre){
                    const createdGenre = await Genre.create({name: genres[i]});
                    genreObjects.push(createdGenre);
                } else {
                    genreObjects.push(foundGenre);
                }
            }
        }
        genres = genreObjects;
        const newBook = { isbn, name, authors, genres, publishDate, quantity };
        let createdBook = await Book.create(newBook);
        return createdBook;
    }  
    createNewBook().then(createdBook => {
        //flash a success message
        req.flash("success", "Book added successfully to store");
        //add this books profile link to all it's authors
        (async ()=>{
            const authorIDs = createdBook.authors;
            for(let i=0; i<authorIDs.length; i++){
                const updatedAuthor = await Author.findByIdAndUpdate(
                    authorIDs[i]._id, 
                    { $push: { books: {_id: createdBook}}}
                );
            }    
            const genreIDs = createdBook.genres;
            for(let i=0; i<genreIDs.length; i++){
                const updatedGenre = await Genre.findByIdAndUpdate(
                    genreIDs[i]._id, 
                    { $push: { books: {_id: createdBook}}}
                );
            }    
        })();
        res.redirect("/books/" + createdBook._id);
    }).catch(err => {
        console.log(err);
        //flash an error message - error in validation
        req.flash("error", err.message);
        res.redirect("/books");
    });
});

//Display profile of a specific book - (everyone)
router.get("/:id", (req, res) => {
    (async function(){
        try {
            const foundBook = await Book.findById(req.params.id);  
            if(typeof(foundBook) === "object"){
                let authorNames = new Array();
                const authorIDs = foundBook.authors;
                for(let i=0; i<authorIDs.length; i++) {
                    const foundAuthor = await Author.findById(authorIDs[i]._id);
                    authorNames.push(foundAuthor.name);
                }
                let genreNames = new Array();
                const genreIDs = foundBook.genres;
                for(let i=0; i<genreIDs.length; i++) {
                    const foundGenre = await Genre.findById(genreIDs[i]._id);
                    genreNames.push(foundGenre.name);
                }
                const commentIDs = foundBook.comments;
                let comments = new Array();
                for(let i=0; i<commentIDs.length; i++) {
                    const foundComment = await Comment.findById(commentIDs[i]._id);
                    comments.push(foundComment);
                }
                res.render("books/profile", {book: foundBook, authorIDs, authorNames, genreIDs, genreNames, comments});
            }
            else throw foundBook;
        } catch (err) {
            console.log(err);
            //flash an error message + No such Book found
            res.redirect("/books");
        }
    })();
});

//Update the quantity of each book available - (admin)
router.get("/:id/update-qty", isAdmin, (req, res) => {
    (async function(){
        try {
            const bookToUpdate = await Book.findById(req.params.id);
            if(typeof(bookToUpdate) === "object"){
                res.render("books/updateQuantity", {book: bookToUpdate});
            } else throw bookToUpdate;
        } catch (err) {
            console.log(err);
            //flash-message - no such book found
            res.redirect("/books");
        }
    })();
});

router.put("/:id/update-qty", isAdmin, (req, res) => {
    (async function(){
        try {
            const bookToUpdate = await Book.findById(req.params.id);
            if(typeof(bookToUpdate) === "object"){
                let newQty = req.body.quantity;
                if(newQty>=0 && newQty<=100){
                    const updatedBook = await Book.findByIdAndUpdate(bookToUpdate._id, {quantity: newQty});
                    //flash - message - quantity update successfully
                    res.redirect("/books/" + updatedBook._id);
                }
            } else throw bookToUpdate;
        } catch (err) {
            console.log(err);
            //flash-message - no such book found
            res.redirect("/books");
        }
    })();
});

//Delete a book - (admin)
router.delete("/:id", isAdmin, (req, res) => {
    (async function(){
        try {
            const bookToDelete = await Book.findById(req.params.id);
            if(typeof(bookToDelete) === "object"){
                const authorIDs = bookToDelete.authors;
                for(let i=0; i<authorIDs.length; i++) {
                    const foundAuthor = await Author.findById(authorIDs[i]._id);
                    await Author.updateOne({_id: foundAuthor._id}, {$pullAll: {books: [bookToDelete]}});
                }
                const genreIDs = bookToDelete.genres;
                for(let i=0; i<genreIDs.length; i++) {
                    const foundGenre = await Genre.findById(genreIDs[i]._id);
                    await Genre.updateOne({_id: foundGenre._id}, {$pullAll: {books: [bookToDelete]}});
                }
                const commentIDs = bookToDelete.comments;
                for(let i=0; i<commentIDs.length; i++) {
                    await Comment.findByIdAndRemove(commentIDs[i]._id);
                }
                const deletedBook = await Book.remove({_id:bookToDelete._id}); 
                if(typeof(deletedBook) === "object"){
                    req.flash("success", "Book deleted Successfully");
                    res.redirect("/books");
                } else throw deletedBook;
            }
            else throw bookToDelete;   
        } catch (err) {
            console.log(err);
            //flash an error message + No such book found
            res.redirect("/books");
        }
    })();
});

module.exports = router;