let express = require("express");
let router = express.Router();
let passport = require("passport");
let jwt = require("jsonwebtoken");
let sgMail = require('@sendgrid/mail');
let { isEligibleForTokenRegeneration, isSignedIn, isSignedOut } = require("../middleware/index");

let Reader = require("../models/reader");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

//get the landing page
router.get("/", (req, res) => {
    res.render("landing");
});

//show register form
// - for admin
router.get("/signup-admin", isSignedOut, function(req, res){
    res.render('signup_admin');
});
// - for reader
router.get("/signup-reader", isSignedOut, function(req, res){
    res.render('signup_reader');
});

//send-verification mail
const sendVerificationMail = (username, token, req, res, successMsg) => {
	const msg = {
		to: username, // Change to your recipient
		from: 'myBrary@support.com', // Change to your verified sender
		subject: 'Account verfication',
		html: `
            <strong>Click the link to activate you account</strong>
            <a href="${process.env.DOMAIN}/activate/${token}/">Activate</a>
        `,
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


//handle the sign up logic - for both
router.post("/signup", isSignedOut, function(req, res){
    (async function(){
        try {
            let { name, username, password, confirm_password } = req.body;
            let isAdmin = false, acc_balance = 0, address = "";
            if(req.body.hasOwnProperty("secret_password")){
                isAdmin = true;
                if(req.body.secret_password !== process.env.ADMIN_ENTRY_SECRET){
                    throw new TypeError("Secret Invalid! please go to reader register page!");
                }
            }else{
                address = req.body.address;
                acc_balance = req.body.acc_balance;
            }
            if(password === confirm_password){
                const token = jwt.sign(
                    { username: username },
                    process.env.JWT_REGISTER_SECRET,
                    { expiresIn: '2d' }
                );
                let newReader;
                if(isAdmin){
                    newReader = new Reader({username: username, isAdmin, name, verification_token: token, acc_balance});
                }else{
                    newReader = new Reader({username: username, isAdmin, name, verification_token: token, address, acc_balance});
                }
                let reader = await Reader.register(newReader, password);
                if(reader){
                    passport.authenticate("local")(req, res, function(){
                        const successMsg ='Registration successful, Please verify your Email-id by clicking on the link sent to your registerd mail-id.';
                        sendVerificationMail(username, token, req, res, successMsg);
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


// Regenerate Token
router.get('/regenrate-token', isSignedIn, isEligibleForTokenRegeneration, (req, res) => {
    (async function () {
        try {
            const token = jwt.sign(
                { username: req.user.username },
                process.env.JWT_REGISTER_SECRET,
                { expiresIn: '2d' }
            );
            reader.verification_token = token;
            await reader.save();
            const successMsg ='Please verify your Email-id by clicking on the link sent to your registerd mail-id.';
            sendVerificationMail(req.user.username, token, req, res, successMsg);
        } catch (err) {
            //flash error message
            req.flash("error", err.message);
            res.redirect("/signin");
        }
    })();
});

// Activate
router.get('/activate/:token', (req, res) => {
	(async function () {
		try {
			const token = req.params.token;
			let decodedToken = await jwt.verify(
				token,
				process.env.JWT_REGISTER_SECRET
            );
			if (decodedToken) {
				let { username } = decodedToken;
				let reader = await Reader.findOne({username});
				if (typeof(reader) === 'object' && Object.keys(reader) !== 0) {
                    if(reader.is_verified){
                        throw new Error("Invalid token, Reader is already verified!");
                    }else{
                        reader.is_verified = true;
                        reader.verification_token = '';
                        await reader.save();
                        req.flash("success", "Account verified successfully, you can now rent books!");
                        res.redirect("/books");
                    }
				} else throw user;
			} else throw decodedToken;
		} catch (err) {
            //flash error message
            req.flash("error", err.message);
            res.redirect("/signin");
		}
	})();
});

//login routes
//login form - for both
router.get("/signin", isSignedOut, function(req, res){
    res.render("signin");
});

//handling login logic
router.post("/signin", passport.authenticate("local", 
    {
        successRedirect: "/",
        failureRedirect: "/signin",
        failureFlash: "Incorrect credentials"
    }), function(req, res){
});

//update-password
router.get("/update-password", isSignedIn, (req, res)=>{
    res.render("update_password");
});

router.post("/update-password", isSignedIn, (req, res)=>{
    (async function(){
        try {
            const {old_password, new_password1, new_password2} = req.body;
            if(new_password1===new_password2){
                const reader = req.user;
                const updatedReader = await reader.changePassword(old_password, new_password1);
                if(typeof(updatedReader)==="object"){
                    await updatedReader.save();
                    req.flash("success", "Password updated successfully!");
                    res.redirect("/books");
                }else throw updatedReader;
            }else{
                throw new Error("Passwords didn't match");
            }
        } catch (err) {
            console.log(err);
            req.flash("error", err.message);
            res.redirect("/forgot-password");
        }
    })();
});

//forgot-password
router.get("/forgot-password", (req, res) => {
    res.render("forgot_password");
});

router.post("/forgot-password", (req, res) => {
    (async function() {
        try {
            const { username } = req.body;
            const reader = await Reader.findOne({username});
            if(typeof(reader) ==="object" && Object.keys(reader) !== 0){
                const token = jwt.sign(
                    { id: reader._id },
                    process.env.JWT_FORGOTPASS_SECRET,
                    { expiresIn: '2d' }
                );
                reader.forget_password_token = token;
                await reader.save();
                const msg = {
                    to: username, 
                    from: 'myBrary@support.com', 
                    subject: 'Reset your account password',
                    html: `
                        <strong>Enter new password: </strong>
                        <form action="${process.env.DOMAIN}/set-password/${token}" method="POST">
                            <input type="password" name="new_password" placeholder="Enter new password" required>
                            <button type="submit">Reset</button>
                        </form>
                    `,
                };
                sgMail
                    .send(msg)
                    .then(() => {
                        req.flash("success", "Reset password instructions have been sent to your mail");
                        res.redirect("/books");
                    })
                    .catch((err) => {
                        throw err;
                    });
            }
            else throw reader;
        } catch (err) {
            console.log(err);
        }
    })();
});

router.post("/set-password/:token", (req, res) => {
    (async function(){
        try {
            const decodedToken = jwt.verify(req.params.token,  process.env.JWT_FORGOTPASS_SECRET);
            if(decodedToken){
                const {id} = decodedToken;
                const readerToUpdate = await Reader.findById(id);
                if(typeof(readerToUpdate)==="object"){
                    if(readerToUpdate.forget_password_token == req.params.token){
                        await readerToUpdate.setPassword(req.body.new_password);
                        readerToUpdate.forget_password_token = "";
                        await readerToUpdate.save();
                        req.flash("success", "Password changed successfully, signin to continue!");
                        res.redirect("/signin");
                    }else throw new Error("Invalid token or user");
                }
            }else throw decodedToken;
        } catch (err) {
            req.flash("error", err.message);
            res.redirect("/");
        }
    })();
});

router.post("/search", (req, res) => {
    (async ()=>{
        try {
            const query = req.body.query;
            if(query.data){
                switch(query.parameter){
                    case "author_name": 
                        res.redirect("/authors/search/" + query.data);
                        break;
                    case "genre_name":
                        res.redirect("/genres/search/" + query.data);
                        break;
                    case "book_name":
                    case "book_ISBN":
                    case "pushlish_date":
                        res.redirect("/books/search/" + query.data + "/" + query.parameter);
                        break;
                    default: throw new Error("Invalid Query");
                }
            }else throw new Error("Empty search data!");
        } catch (err) {
            req.flash("err", err.message);
            res.redirect("back");
        }
    })();
});

//logout
router.get('/signout', isSignedIn, (req, res) => {
    req.logout();
    req.flash("success", "Signed out successfully!");
	res.redirect('/');
});

module.exports = router;