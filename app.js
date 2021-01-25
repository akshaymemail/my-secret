//requiring dotenv config
require('dotenv').config()

// requiring the npm packages
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const encrypt = require('mongoose-encryption');
const md5 = require('md5')
const bcrypt = require('bcrypt')

// passport.js packages
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')

//crating bcrypt salt rounds
const bcryptSalt = 10

// creating express app
const app = express()

// making public folder static
app.use(express.static('public'))

// let app use bodyParser
app.use(bodyParser.urlencoded({
    extended: true
}))

// setting ejs view engine
app.set('view engine', 'ejs')

// let app use session
app.use(session({
    secret: 'i am secret',
    resave: false,
    saveUninitialized: false
}))

// initialize the session
app.use(passport.initialize())
app.use(passport.session())
mongoose.set('useCreateIndex', true);
// creating the connection with mongodb
mongoose.connect('mongodb://localhost:27017/userDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

// creating the schema
const schema = new mongoose.Schema({
    email: String,
    password: String
})

//creating the schema plugin
schema.plugin(passportLocalMongoose)

// creating the the model
const User = mongoose.model('User', schema)

// usign passport to create strtegy
passport.use(User.createStrategy())

// creating passport to serialize and deserialize
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())



// listening the home router
app.get('/', function (req, res) {
    res.render('home')
})

// listening the login route
app.get('/login', function (req, res) {
    res.render('login')
})

// listening the register route
app.get('/register', function (req, res) {
    res.render('register')
})

// listening the the secret route
app.get('/secrets', function (req, res) {
    // checking if the user is authenticated or not
    if (req.isAuthenticated()) {
        // user is authenticated
        res.render('secrets')
    } else {
        // user is not authenticated
        res.redirect('/login')
    }
})

// posting the register route
app.post('/register', function (req, res) {
    // registring the user
    User.register({
        username: req.body.username
    }, req.body.password, function (err, user) {
        if (err) {
            // there was some err register again
            console.log(err)
            res.redirect('/register')
        } else {
            // user was registered new authenticating
            passport.authenticate('local')(req, res, function () {
                // user was authenticated, redirecting the secrets route
                res.redirect('/secrets')
            })
        }
    })
})

// posting the login route
app.post('/login', function (req, res) {
    // loging the user
    req.login(new User({
        username: req.body.username,
        password: req.body.password
    }), function (err) {
        // checking the err
        if (err) {
            // user not found
            console.log(err)
        } else {
            // user found now authenticate
            passport.authenticate('local')(req, res, function () {
                // user was authenticated, redirecting to the secrets route
                res.redirect('/secrets')
            })
        }
    })
})

// listning the login routes
app.get('/logout', function (req, res) {
    // loging out the  user
    req.logout()
    // redirect to the root route
    res.redirect('/')
})

// spinning the server at port 3000
app.listen(3000, function () {
    console.log('Server is running at port 3000')
})