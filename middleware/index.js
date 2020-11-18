const jwt = require("jsonwebtoken");
const Comment = require("../models/comment");
const Book = require("../models/book");

let middlewareObj = {
    isVerified: function(req, res, next){
        if(req.isAuthenticated() && req.user.is_verified){
            return next();
        }
        req.flash("error", "You need to be a Verified Reader to do that, please verify your email address!");
        res.redirect("back");
    },
    isSignedOut: function(req, res, next){
                    if(!req.isAuthenticated()){
                        return next();
                    }
                    req.flash("error", "You can't do this if you are Signed in!");
                    res.redirect("/");
    },
    isSignedIn: function(req, res, next){
                    if(req.isAuthenticated()){
                        return next();
                    }
                    req.flash("error", "You need to be Signed in to do that!");
                    res.redirect("/signin");
                },
    isAdmin: function(req, res, next){
        if(req.isAuthenticated() && req.user.isAdmin){
            return next();
        }
        req.flash("error", "You need to be Administrator to do that!");
        res.redirect("/");
    },
    isNotAdmin: function(req, res, next){
        if(req.isAuthenticated() && !req.user.isAdmin){
            return next();
        }
        req.flash("error", "You can't be an administrator to do this!");
        res.redirect("/");
    },

    isEligibleForTokenRegeneration: (req, res, next) => {
        (async function(){
            try{
                if(req.user.is_verified === false){
                    jwt.verify(req.user.verification_token, process.env.JWT_REGISTER_SECRET, (err, decodedToken) => {
                        if(err){
                            return next();
                        }else{
                            throw new Error();
                        }
                    });
                }else{
                    req.flash("error", "Reader is already verified!");
                    res.redirect("/books");
                }
            }catch(err){
                req.flash("error", "The previous token is still valid, please activate using that.");
                res.redirect("/books");
            }
        })();
    },

    checkCommentOwnership:
        function (req, res, next){
            (async ()=>{
                try {
                    const comment = await Comment.findById(req.params.comment_id);
                    if(typeof(comment)==="object" && Object.keys(comment)!==0){
                        if(comment.author.id.equals(req.user._id)){
                            next();
                        }else{
                            throw new Error("You don't have permission to do this");
                        }
                    }else throw comment;
                } catch (err) {
                    req.flash("error", err.message);
                    res.redirect("back");
                }
            })();
        }    
}

module.exports = middlewareObj;