let express = require("express");
let router = express.Router({mergeParams: true});
let Book = require("../models/book");
let Comment = require("../models/comment");
let middleware = require("../middleware");

//COMMENT ROUTES
//new route for showing the form to add a comment { a nested route }
router.get("/new", middleware.isSignedIn, (req, res) => {
    //find the campground by id and pass it to the callback function
    (async ()=>{
        try {
            const book = await Book.findById(req.params.id);
            if(typeof(book)==="object" && Object.keys(book)!==0){
                res.render("comments/new", {book});
            }else throw book;
        } catch (err) {
            req.flash("error", err.message);
            res.redirect("/books/"+req.params.id);
        }
    })();
});

//post route to add a new comment to the selected campground
router.post("/", middleware.isSignedIn, (req, res) => {
    (async ()=>{
        try {
            const reader = req.user;
            const book = await Book.findById(req.params.id);
            if(typeof(book)==="object" && Object.keys(book)!==0){
                const comment = await Comment.create(req.body.comment);
                if(typeof(comment)==="object" && Object.keys(comment)!==0){
                    comment.author.id = reader._id;
                    comment.author.authorName = reader.name;
                    await comment.save();
                    const updatedBook = await Book.findByIdAndUpdate(
                        req.params.id,
                        { $push: { comments: { _id: comment }}}
                    );
                    if(typeof(updatedBook)==="object" && Object.keys(updatedBook)!==0){
                        req.flash("success", "Comment successfully added.");
                        res.redirect("/books/"+updatedBook._id);
                    }else throw updatedBook;
                }else throw comment;
            }else throw book;
        } catch (err) {
            req.flash("error", err.message);
            res.redirect("/books/"+req.params.id);
        }
    })();
});

//edit route
router.get("/:comment_id/edit", middleware.checkCommentOwnership, (req, res) => {
    (async ()=>{
        try {
            const comment = await Comment.findById(req.params.comment_id);
            if(typeof(comment)==="object" && Object.keys(comment)!==0){
                res.render("comments/edit", {book_id: req.params.id, comment});
            }else throw comment;
        } catch (err) {
            req.flash("error", err.message);
            res.redirect("back");
        }
    })();
});

//update - route
router.put("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
    (async ()=>{
        try {
            const updatedComment = await Comment.findByIdAndUpdate(req.body.comment);
            if(typeof(updatedComment)==="object" && Object.keys(updatedComment)!==0){
                req.flash("success", "Comment edit successful");
                res.redirect("/books/", req.params.id);
            }else throw updatedComment;
        } catch (err) {
            req.flash("error", err.message);
            res.redirect("back");
        }
    })();
});

//destroy - route
router.delete("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
    (async ()=>{
        try {
            const book = await Book.findById(req.params.id);
            if(typeof(book)==="object" && Object.keys(book)!==0){
                const commentToDelete = await Comment.findById(req.params.comment_id);
                if(typeof(commentToDelete)==="object" && Object.keys(commentToDelete)!==0){
                    const updatedBook = await Book.updateOne({_id: book._id}, {$pullAll: {comments: [commentToDelete]}});
                    if(updatedBook){
                        const deleteResult = await Comment.findByIdAndRemove(req.params.comment_id);
                        // console.log(deleteResult);
                        if(!deleteResult){
                            req.flash("success", "Comment deleted!");
                            res.redirect("/books/" + req.params.id);
                        }else throw deleteResult;
                    }else throw updatedBook;
                }else throw commentToDelete;
            }else throw new Error("Requested Book unavailable");
            
        } catch (err) {
            req.flash("error", err.message);
            res.redirect("back");
        }
    })();
});

module.exports = router;