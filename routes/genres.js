let express = require("express");
let router = express.Router();
let passport = require("passport");
let Genre = require("../models/genre");
let Book = require("../models/book");

//Display a genres - (everyone)
router.get("/", (req, res) => {
    async function getAllGenres() {
        return await Genre.find({});
    }
    getAllGenres().then(genres => {
        res.render("genres/index", {genres});
    }).catch(err => console.log(err));
});

//Add a new genre - (admin)
router.get("/new", (req, res) => {
    res.render("genres/new");
});
//add the author
router.post("/new", (req, res) => {
    (async function(){
        try {
            let newGenre = {
                name: req.body.name
            }
            const createdGenre = await Genre.create(newGenre);  
            if(!(Object.keys(createdGenre).length === 0 && createdGenre.constructor === Object))
                res.redirect("/genres/" + createdGenre._id);
            else throw createdGenre;
        } catch (err) {
            //flash an error message +
            req.flash("error", err.message);
            res.redirect("/genres");
        }
    })();
});

//Display all the info a specific genre - (everyone)
router.get("/:id", (req, res) => {
    (async function(){
        try {
            const foundGenre = await Genre.findById(req.params.id);
            if(typeof(foundGenre) === "object"){
                let bookNames = new Array();
                const bookIDs = foundGenre.books;
                for(let i=0; i<bookIDs.length; i++) {
                    const foundBook = await Book.findById(bookIDs[i]["_id"]);
                    bookNames.push(foundBook.name);
                }
                res.render("genres/profile", {genre: foundGenre, bookIDs, bookNames});
            }
            else throw foundGenre;
        } catch (err) {
            //flash an error message + No such genre found
            req.flash("error", "No such Genre is found in the store!");
            res.redirect("/genres");
        }
    })();
});
//Add a new book to an existing genre - (admin)
router.get("/:id/add-book", (req, res) => {
    (async function(){
        try {
            const genreToUpdate = await Genre.findById(req.params.id);
            if(typeof(genreToUpdate) === "object"){
                res.render("genres/addNewBook", {genre: genreToUpdate});
            } else throw genreToUpdate;
        } catch (err) {
            console.log(err);
            //flash-message - no such book found
            res.redirect("/genres");
        }
    })();
});

router.put("/:id/add-book", (req, res) => {
    (async function(){
        try {
            const genreToUpdate = await Genre.findById(req.params.id);
            if(!(Object.keys(genreToUpdate).length === 0 && genreToUpdate.constructor === Object)){
                const isbn = req.body.isbn;
                const bookToBeAdded = await Book.findOne({isbn: isbn});
                if(!bookToBeAdded){
                    //flash - invalid isbn, add this as a new book
                    req.flash("error", "Book not found, add this to store to continue!");
                    res.redirect("/books/new");
                }else{
                    if(genreToUpdate.books.includes({_id: bookToBeAdded})){
                        //flash-error - this book is already present in this genre
                        res.redirect("/genres/" + genreToUpdate._id);
                    }else{
                        const updatedGenre = await Genre.findByIdAndUpdate(
                            req.params.id, 
                            { $push: { books: { _id: bookToBeAdded }}}
                        );
                        if(typeof(updatedGenre) === "object"){
                            const updatedBook = await Book.updateOne(
                                {_id: bookToBeAdded._id}, 
                                { $push: { authors: {_id: updatedGenre}}}
                            );
                            res.redirect("/authors/" + updatedGenre._id);
                        } else throw updatedGenre;
                    }
                }
            } else throw genreToUpdate;
        } catch (err) {
            console.log(err);
            //flash-message - no such book found
            res.redirect("/authors");
        }
    })();
});
//Delete a particular book from a genre - (admin)

//Delete a genre
router.delete("/:id", (req, res) => {
    //an genre can be deleted only if it has no book
    (async function(){
        try {
            const genreToDelete = await Genre.findById(req.params.id);  
            if(typeof(genreToDelete) === "object"){
                if(genreToDelete.books.length > 0){
                    //flash a message - author can't be deleted 
                    res.redirect("/genres/" + genreToDelete._id);
                } else {
                    //flash a message - author deleted successfully 
                    await Genre.remove({_id: genreToDelete._id});
                    res.redirect("/genres");
                }
            }
            else throw genreToDelete;
        } catch (err) {
            //flash an error message + No such author found
            res.redirect("/authors");
        }
    })();
});

module.exports = router;