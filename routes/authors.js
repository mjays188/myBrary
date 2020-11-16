let express = require("express");
let router = express.Router();
let passport = require("passport");
let Author = require("../models/author");
let Book = require("../models/book");

//Display all authors - (everyone)
router.get("/", (req, res) => {
    async function getAllAuthors() {
        return await Author.find({});
    }
    getAllAuthors().then(authors => {
        res.render("authors/index", {authors});
    }).catch(err => console.log(err));
});


//Add a new author - (admin)
//Get the form
router.get("/new", (req, res) => {
    res.render("authors/new");
});
//add the author
router.post("/new", (req, res) => {
    (async function(){
        try {
            let newAuthor = {
                name: req.body.name
            }
            const createdAuthor = await Author.create(newAuthor);  
            if(!(Object.keys(createdAuthor).length === 0 && createdAuthor.constructor === Object))
                res.redirect("/authors/" + createdAuthor._id);
            else throw createdAuthor;
        } catch (err) {
            req.flash("error", err.message);
            res.redirect("/authors");
        }
    })();
});

//Display profile of a specific author - (everyone)
router.get("/:id", (req, res) => {
    (async function(){
        try {
            const foundAuthor = await Author.findById(req.params.id);
            if(typeof(foundAuthor) === "object"){
                let bookNames = new Array();
                const bookIDs = foundAuthor.books;
                for(let i=0; i<bookIDs.length; i++) {
                    const foundBook = await Book.findById(bookIDs[i]["_id"]);
                    bookNames.push(foundBook.name);
                }
                res.render("authors/profile", {author: foundAuthor, bookIDs, bookNames});
            }
            else throw foundAuthor;
        } catch (err) {
            //flash an error message + No such author found
            res.redirect("/authors");
        }
    })();
});

//Add a new book by an author - (admin)
router.get("/:id/add-book", (req, res) => {
    (async function(){
        try {
            const authorToUpdate = await Author.findById(req.params.id);
            if(typeof(authorToUpdate) === "object"){
                res.render("authors/addNewBook", {author: authorToUpdate});
            } else throw authorToUpdate;
        } catch (err) {
            console.log(err);
            //flash-message - no such book found
            res.redirect("/authors");
        }
    })();
});

router.put("/:id/add-book", (req, res) => {
    (async function(){
        try {
            const authorToUpdate = await Author.findById(req.params.id);
            if(!(Object.keys(authorToUpdate).length === 0 && authorToUpdate.constructor === Object)){
                const isbn = req.body.isbn;
                const bookToBeAdded = await Book.findOne({isbn: isbn});
                if(!bookToBeAdded){
                    //flash - invalid isbn, add this as a new book
                    res.redirect("/books/new");
                }else{
                    if(authorToUpdate.books.includes({_id: bookToBeAdded})){
                        //flash-error - this book is already present in author's profile
                        res.redirect("/authors/" + authorToUpdate._id);
                    }else{
                        const updatedAuthor = await Author.findByIdAndUpdate(
                            req.params.id, 
                            { $push: { books: { _id: bookToBeAdded }}}
                        );
                        if(typeof(updatedAuthor) === "object"){
                            const updatedBook = await Book.updateOne(
                                {_id: bookToBeAdded._id}, 
                                { $push: { authors: {_id: updatedAuthor}}}
                            );
                            res.redirect("/authors/" + updatedAuthor._id);
                        } else throw updatedAuthor;
                    }
                }
            } else throw authorToUpdate;
        } catch (err) {
            console.log(err);
            //flash-message - no such book found
            res.redirect("/authors");
        }
    })();
});

//Delete an author - (admin)
router.delete("/:id", (req, res) => {
    //an author can be deleted only if it has written no book
    (async function(){
        try {
            const authorToDelete = await Author.findById(req.params.id);  
            if(typeof(authorToDelete) === "object"){
                if(authorToDelete.books.length > 0){
                    req.flash("error", "Author can't be deleted!");
                    res.redirect("/authors/" + authorToDelete._id);
                } else {
                    req.flash("success", "Author deleted successfully!");
                    await Author.remove({_id: authorToDelete._id});
                    res.redirect("/authors");
                }
            }
            else throw authorToDelete;
        } catch (err) {
            //flash an error message + No such author found
            res.redirect("/authors");
        }
    })();
});

module.exports = router;