const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const path = require("path");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const passport = require("passport");
const methodOverride = require("method-override");
const LocalStrategy = require("passport-local");
require("dotenv").config({ path: path.join(__dirname, "/.env")});

//import all models
const Reader = require("./models/reader");
const Author = require("./models/author");
const Book = require("./models/book");
const Genre = require("./models/genre");
const Transaction = require("./models/transaction");

//import all routes
const indexRoutes = require("./routes/index");
const readers = require("./routes/readers");
const authors = require("./routes/authors");
const books = require("./routes/books");
const genres = require("./routes/genres");
const transactions = require("./routes/transactions");

const secrets = process.env;

//Connect to database
mongoose.connect(secrets.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

//on Connection
mongoose.connection.on('connected', () => {
    console.log('Connected to DB successfully!');
});

//on Error
mongoose.connection.on('error', (err) => {
    console.error("Something went wrong!\n" + err);
});

const app = express();
app.set("view engine", "ejs"); 

//PORT number
const PORT = secrets.PORT;

//cors middleware
app.use(cors());

//body parser middleware
app.use(bodyParser.urlencoded({extended: true}));

//static folder
app.use(express.static(path.join(__dirname, "/public/")));

//method-override middleware
app.use(methodOverride("_method"));

//flashing messages
app.use(flash());

//passport configuration
app.use(require("express-session")({
    secret: secrets.HASH_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(Reader.authenticate()));
passport.serializeUser(Reader.serializeUser());
passport.deserializeUser(Reader.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentReader = req.reader;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

//routing
app.use("/", indexRoutes);
// app.use("/readers", readers);
app.use("/books", books);
app.use("/authors", authors);
app.use("/genres", genres);
// app.use("/transactions", transactions);

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));