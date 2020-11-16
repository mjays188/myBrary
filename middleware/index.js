const jwt = require("jsonwebtoken");
let middlewareObj = {
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
        if(req.isAuthenticated()){
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
    }
}

module.exports = middlewareObj;