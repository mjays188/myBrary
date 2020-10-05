let express = require("express");
let router = express.Router();
let passport = require("passport");
let Reader = require("../models/reader");

//get the landing page
router.get("/", (req, res) => {
    res.render("landing");
});

//show register form
// - for admin
router.get("/signup-admin", function(req, res){
    res.render('signup_admin');
});
// - for reader
router.get("/signup-reader", function(req, res){
    res.render('signup_reader');
});

//handle the sign up logic - for both
router.post("/signup", function(req, res){
    (async function(){
        try {
            let { name, username, password, confirm_password } = req.body;
            let isAdmin = false;
            if(req.body.hasOwnProperty("secret_password")){
                isAdmin = true;
                if(req.body.secret_password !== process.env.ADMIN_ENTRY_SECRET){
                    throw new TypeError("Secret Invalid! please go to reader register page!");
                }
            }
            if(password === confirm_password){
                // const reader = new  new Reader({username: username,isAdmin, name});
                // await reader.setPassword(password);
                // await reader.save();
                // const { user } = await DefaultUser.authenticate()('user', 'password');

                
                const newReader = new Reader({username: username,isAdmin, name});
                let reader = await Reader.register(newReader, password);
                console.log(reader)
                if(typeof(reader)=="object" && Object.keys(reader) > 0){
                    passport.authenticate("local")(req, res, () => {
                        console.log("authenticated successfully");
                        req.flash("success", "Welcome to MyBrary" + reader.name);
                        res.redirect("/readers/profile");
                    });
                } else throw reader;
            } else throw new TypeError("Passwords didn't match!");
        } catch (err) {
            console.log(err);
            //flash error message
            req.flash("error", err.message);
            res.redirect("/signin");
        }
    })();
});
//login routes
//login form - for both
router.get("/signin", function(req, res){
    res.render("signin");
});

//handling login logic

//logout

module.exports = router;