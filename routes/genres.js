let express = require("express");
let router = express.Router();
let Genre = require("../models/genre");
let Book = require("../models/book");

let {isAdmin} = require("../middleware");

//Display a genres - (everyone)
router.get("/", (req, res) => {
    async function getAllGenres() {
        return await Genre.find({});
    }
    getAllGenres().then(genres => {
        let bookCount = new Array();
        genres.forEach(genre => {
            bookCount.push(genre.books.length);
        });
        res.render("genres/index", {genres, bookCount});
    }).catch(err => console.log(err));
});

//search results
router.get("/search/:data", (req, res) => {
    (async ()=>{
        try {
            const genres = await Genre.find({name: new RegExp(req.params.data, "i")});
            if(genres){
                res.render("genres/index", {genres});
            }else throw new Error(`No ${req.params.data} books found in the store`);
        } catch (err) {
            req.flash("error", err.message);
            res.redirect("/genres");
        }
    })();
});

//Add a new genre - (admin)
router.get("/new", isAdmin, (req, res) => {
    res.render("genres/new");
});
//add the author
router.post("/new", isAdmin, (req, res) => {
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
            req.flash("error", "Genre already exists");
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
                let bookDetails = new Array();
                const bookIDs = foundGenre.books;
                for(let i=0; i<bookIDs.length; i++) {
                    const foundBook = await Book.findById(bookIDs[i]["_id"]);
                    bookDetails.push({id: foundBook._id, name: foundBook.name, image: foundBook.image});
                }
                res.render("genres/profile", {genre: foundGenre, bookDetails});
            }
            else throw foundGenre;
        } catch (err) {
            req.flash("error", "No such Genre is found in the store!");
            res.redirect("/genres");
        }
    })();
});
//Add a new book to an existing genre - (admin)
router.get("/:id/add-book", isAdmin, (req, res) => {
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

router.put("/:id/add-book", isAdmin, (req, res) => {
    (async function(){
        try {
            const genreToUpdate = await Genre.findById(req.params.id);
            if(!(Object.keys(genreToUpdate).length === 0 && genreToUpdate.constructor === Object)){
                const isbn = req.body.isbn;
                const bookToBeAdded = await Book.findOne({isbn: isbn});
                if(!bookToBeAdded){
                    req.flash("error", "Book not found, add this to store to continue!");
                    res.redirect("/books/new");
                }else{
                    if(genreToUpdate.books.includes({_id: bookToBeAdded})){
                        req.flash("error", "This book is already present in this genre!");
                        res.redirect("/genres/" + genreToUpdate._id);
                    }else{
                        const updatedGenre = await Genre.findByIdAndUpdate(
                            req.params.id, 
                            { $push: { books: { _id: bookToBeAdded }}}
                        );
                        if(typeof(updatedGenre) === "object"){
                            const updatedBook = await Book.updateOne(
                                {_id: bookToBeAdded._id}, 
                                { $push: { genres: {_id: updatedGenre}}}
                            );
                            res.redirect("/genres/" + updatedGenre._id);
                        } else throw updatedGenre;
                    }
                }
            } else throw genreToUpdate;
        } catch (err) {
            req.flash("error", err.message);
            res.redirect("/authors");
        }
    })();
});

//Delete a genre
router.delete("/:id", isAdmin, (req, res) => {
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