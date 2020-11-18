let express = require("express");
let router = express.Router();
let Reader = require("../models/reader");
let Book = require("../models/book");
const { isSignedIn, isNotAdmin, isVerified } = require("../middleware/index");

//display profile page of a reader 
router.get("/:id", isSignedIn, (req, res) => {
    (async function(){
        try {
            const requestedId = req.params.id;
            if(requestedId == req.user._id || req.user.isAdmin){
                res.render("readers/profile");
            }else{
                throw new Error("You are not permitted to do that");
            }
        } catch (err) {
            req.flash("error", err.message);
            res.redirect("/");
        }
    })();
});

//show cart
router.get("/:id/show-cart", isNotAdmin, (req, res) => {
    (async ()=>{
        try {
            const reader = req.user;
            if(reader._id.equals(req.params.id)){
                let booksInCart = new Array();
                for(let i=0;i<reader.cart.length;i++){
                    const book = await Book.findById(reader.cart[i]._id);
                    booksInCart.push(book);
                }
                res.render("cart/show", {booksInCart});
            }else throw new Error("You are not allowed to do that");   
        } catch (err) {
            req.flash("error", err.message);
            res.redirect("back");
        }
    })();
});

//add a book to cart
router.post("/:id/add-to-cart", isNotAdmin, isVerified, (req, res) => {
    (async ()=>{
        try {
            let reader = req.user;
            let book = await Book.findById(req.params.id);
            if(book){
                const noOfBooksInCart = reader.cart.length;
                if(book.quantity === 0)
                    throw new Error("Book unavailable right now!");
                if(reader.acc_balance - noOfBooksInCart*500 >= 500 && reader.current_issues <= 5 ){
                    //book can be rented
                    let alreadyPresent = false;
                    for(let i=0;i<reader.cart.length;i++){
                        if(reader.cart[i]._id.equals(book._id)){
                            alreadyPresent = true;
                            break;
                        }
                    }
                    if(alreadyPresent){
                        throw new Error("Book is already present in the cart");
                    }else{
                        const updatedReader = await Reader.findByIdAndUpdate(
                            reader._id, 
                            { $push: { cart: {_id: book}}}
                        );
                        if(updatedReader){
                            req.flash("success", "Book successfully added to cart");
                            res.redirect("back");
                        }else throw new Error("Something went wrong, unable to add this book to cart");
                    }
                }else throw new Error("Insufficient balance to add one more book, please manage your cart");

            }else throw new Error("Requested book is unavailable");
        } catch (err) {
            req.flash("error", err.message);
            res.redirect("back");
        }
    })();
});

//remove from cart
router.post("/:id/remove-from-cart", isNotAdmin, isVerified, (req, res) => {
    (async ()=>{
        try {
            let reader = req.user;
            let book = await Book.findById(req.params.id);
            if(book){
                const noOfBooksInCart = reader.cart.length;
                    let present = true;
                    for(let i=0;i<reader.cart.length;i++){
                        if(reader.cart[i]._id.equals(book._id)){
                            await Reader.findByIdAndUpdate(
                                reader._id, 
                                {$pullAll: {cart: [book]}}
                            );
                            break;
                        }
                    }
                    if(present){
                        req.flash("success", "Book successfully removed from the cart");
                        res.redirect("back");
                    }else throw new Error("Book is not in the cart");
            }else throw new Error("Requested book is unavailable");
        } catch (err) {
            req.flash("error", err.message);
            res.redirect("back");
        }
    })();
});

//checkout
router.post("/:id/checkout", isNotAdmin, (req, res)=>{
    (async ()=>{
        try {
            const reader = req.user;
            const reader_transacted = await Reader.findById(req.params.id);
            if(reader_transacted && reader_transacted._id.equals(reader._id)){
                //make a transaction with status pending
                //update balance, current_issues of reader, add this transaction to reader, empty the cart
            }else throw new Error("You aren't permitted to do this");
        } catch (err) {
            req.flash("error", err.message);
            res.redirect("back");
        }
    })();
});

//update balance
router.get("/:id/add-money", isNotAdmin, isVerified, (req, res)=>{
    (async ()=>{
        try {
            const reader = await Reader.findById(req.params.id);
            if(reader._id.equals(req.user._id)){
                res.render("readers/add_money");
            }else throw new Error("You are not permitted to do this");
        } catch (err) {
            req.flash("error", err.message);
            res.redirect("back");
        }
    })();
});

router.put("/:id/add-money", isNotAdmin, isVerified, (req, res)=>{
    (async ()=>{
        try {
            const reader = await Reader.findById(req.params.id);
            if(reader && reader._id.equals(req.user._id)){
                console.log("Im here");
                const {amountToAdd} = req.body;
                const newBal = reader.acc_balance + amountToAdd;
                if(newBal <= 3000){
                    
                    const updatedReader = await Reader.findByIdAndUpdate(reader._id, { acc_balance: newBal});
                    console.log(updatedReader);
                    if(updatedReader){
                        req.flash("success", "Amount successfully added");
                        res.redirect("/readers/" + reader._id);
                    }else throw new Error("Something went wrong");
                }else new Error("Maximum allowed balance is Rs.3000");
            }else throw new Error("You are not permitted to do this");
        } catch (err) {
            req.flash("error", err.message);
            res.redirect("back");
        }
    })();
});

//Delete a reader
router.post("/:id/delete", isSignedIn, (req, res) => {
    (async function(){
        try {
            const { id } = req.params;
            if(id == req.user._id || req.user.isAdmin){
                await Reader.findByIdAndRemove(id);
                res.redirect('/signout');
            }else throw new Error("You are not permitted to do this!");
        } catch (err) {
            req.flash("error", err.message);
            res.redirect("/");
        }
    })();
});

module.exports = router;