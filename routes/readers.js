let express = require("express");
let router = express.Router();
let sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

let Reader = require("../models/reader");
let Book = require("../models/book");
let Transaction = require("../models/transaction");
const { isSignedIn, isNotAdmin, isVerified } = require("../middleware/index");

//sendConfirmationalMail
const sendConfirmationalMail = (username, subject, req, res, message, successMsg) => {
	const msg = {
		to: username, // Change to your recipient
		from: 'myBrary@support.com', // Change to your verified sender
		subject: subject,
		html: message,
	};
	sgMail
		.send(msg)
		.then(() => {
            req.flash("success", successMsg);
            res.redirect("/books");
		})
		.catch((err) => {
			throw err;
		});
};

//display profile page of a reader 
router.get("/:id", isSignedIn, (req, res) => {
    (async function(){
        try {
            const reader = req.user;
            if(reader._id.equals(req.params.id)){
                let transactions = new Array();
                for(let i=0;i<reader.transactions.length;i++){
                    const t = await Transaction.findById(reader.transactions[i]._id);
                    transactions.push(t);
                }
                res.render("readers/profile", { transactions });
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
                }else throw new Error("Insufficient balance to add one more book or issue limit is reached, please manage your dues");

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

//return a book
router.post("/:id/return", isNotAdmin, isVerified, (req, res) => {
    (async ()=>{
        try {
            const reader = req.user;
            const book = await Book.findById(req.params.id);
            if(typeof(book)==="object" && Object.keys(book)!==0){
                const allTransactions = reader.transactions;
                let currentDate = new Date();
                let revenue = currentDate.getUTCMinutes();
                let transactionToUpdate;
                for(let i=0;i<allTransactions.length;i++){
                    const t = await Transaction.findById(allTransactions[i]._id);
                    if(t.book.id.equals(book._id) && t.status == "Borrowed"){
                        transactionToUpdate = t;
                        revenue -= t.borrow_date.getUTCMinutes();
                        break;
                    }
                }
                if(revenue > 60)
                    revenue = 500;
                await Book.findByIdAndUpdate(book._id, {
                    $inc: {quantity: 1}
                });
                //revenue generated
                //add money to admin
                const admin = await Reader.findOne({isAdmin: true});
                admin.acc_balance += revenue;
                await admin.save();
                //remove movey from
                reader.acc_balance += (500-revenue);
                reader.current_issues -= 1;
                await reader.save();
                await Transaction.findByIdAndUpdate(transactionToUpdate._id, {
                    status: "Returned",
                    $set: { revenue: revenue}
                });
                //confirmation billing email sent
                const msg = `${book.name} successfully retured, bill amount: Rs${revenue}`;
                sendConfirmationalMail(reader.username, "Book Return Confirmation",req, res, msg , "Book Successfully Returned ");
            }else throw new Error("You are not permitted to do that");
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
            const { duration } = req.body;
            const reader_transacted = await Reader.findById(req.params.id);
            let msg = "Order Successfully placed, book details: \n";
            if(reader_transacted && reader_transacted._id.equals(reader._id)){
                if(reader.acc_balance >= duration.length * 500 && reader.current_issues + duration.length <= 6){
                    let transaction, allTransactions = new Array();
                    for(let i=0;i<duration.length;i++){
                        duration[i] = parseInt(duration[i]) * 7;
                        //make a transaction with status pending
                        const bookToRemove = await Book.findById(reader.cart[i]._id);
                        if(bookToRemove.quantity < 0)
                            throw new Error(bookToRemove.name + " Unavailable right now.");
                        const t = await Transaction.create({
                            reader: {id: reader_transacted}, 
                            book: {id: reader.cart[i]},
                            duration: duration[i]
                        });
                        allTransactions.push(t);

                        await Book.findByIdAndUpdate(bookToRemove._id, {
                            $inc: {quantity: -1, totalIssues: 1}
                        });
                        msg = msg + bookToRemove.name + " " + duration[i] + " days.\n";
                        const newBal = reader.acc_balance - 500
                        await Reader.findByIdAndUpdate(reader._id,
                            {
                                $set: {acc_balance: newBal},
                                $push: { transactions: {_id: t}},
                                $inc: { current_issues: 1 },
                                $pullAll: { cart: [bookToRemove]}
                            }
                        );
                    }
                    //send a order confirmation mail
                    
                    sendConfirmationalMail(reader.username, "Order Confirmation", req, res, msg, "Order Successful, details have been sent to your mail");
                }else throw new Error("Insufficient account balance or issue limit reached!");
            }else throw new Error("You aren't permitted to do this");
        } catch (err) {
            req.flash("error", err.message);
            res.redirect("back");
        }
    })();
});

//show transactions
router.get("/:id/transactions", isVerified, (req, res) => {
    (async ()=>{
        try {
            const reader = await Reader.findById(req.params.id);
            if(reader._id.equals(req.user._id)){
                let transactions, readers = new Array();
                if(reader.isAdmin){
                    transactions = await Transaction.find({});
                    for(let i=0;i<transactions.length;i++){
                        const r = await Reader.findById(transactions[i].reader.id);
                        readers.push(r);
                    }
                }else{
                    readers.push(reader);
                    transactions = new Array();
                    let transactionIds = reader.transactions;
                    for(let i=0;i<transactionIds.length;i++){
                        const t = await Transaction.findById(transactionIds[i]._id);
                        transactions.push(t);
                    }
                }
                res.render("readers/transactions", {transactions, readers});
            }else throw new Error("You are not permitted to do that");
        } catch (err) {
            req.flash("error", err.message);
            res.redirect("back");
        }
    })();
});
//update balance
//get update form
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
//update in db
router.put("/:id/add-money", isNotAdmin, isVerified, (req, res)=>{
    (async ()=>{
        try {
            const reader = await Reader.findById(req.params.id);
            if(reader && reader._id.equals(req.user._id)){
                const newBal = parseInt(reader.acc_balance) + parseInt(req.body.amountToAdd);
                if(newBal <= 3000){
                    const updatedReader = await Reader.updateOne({_id: reader._id}, { acc_balance: newBal});
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

//empty-money
router.put("/:id/empty-money", isNotAdmin, isVerified, (req, res)=>{
    (async ()=>{
        try {
            const reader = await Reader.findById(req.params.id);
            if(reader && reader._id.equals(req.user._id)){
                const updatedReader = await Reader.updateOne({_id: reader._id}, { acc_balance: 0});
                if(updatedReader){
                    req.flash("success", "Account successfully Emptied");
                    res.redirect("/readers/" + reader._id);
                }else throw new Error("Something went wrong");
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