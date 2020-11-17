let express = require("express");
let router = express.Router();
let Reader = require("../models/reader");
const { isSignedIn } = require("../middleware/index");

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