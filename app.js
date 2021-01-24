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

// creating the connection with mongodb
mongoose.connect('mongodb://localhost:27017/userDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

// creating the schema
const schema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
})

// creating the the model
const User = mongoose.model('User', schema)

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

// spinning the server at port 3000
app.listen(3000, function () {
    console.log('Server is running at port 3000')
})

// posting the register route
app.post('/register', function (req, res) {
    // generating 10 roundSalt has using bcrypt
    bcrypt.hash(req.body.password, bcryptSalt, function (err, hash) {
        // creating a new user
        new User({
            email: req.body.username,
            password: hash // hashing the password with bcrypt
        }).save(function (err) {
            // checking the error
            if (err) {
                // there was an error
                res.send(err);
            } else {
                // user was successfully added, redirect to the secret page
                res.render('secrets')
            }
        })
    })

})

// posting the login route
app.post('/login', function (req, res) {
    // finding the user in the database
    User.findOne({
        email: req.body.username
    }, function (err, foundUser) {
        if (err) {
            // there was an error
            console.log(err)
        } else {
            // username was successfully found, checking for password
            bcrypt.compare(req.body.password, foundUser.password, function (err, result) {
                if (result) {
                    // user was successfully verified
                    res.render('secrets')
                } else {
                    // user was not found
                    res.send("Your email or password is wrong")
                }
            })
        }
    })

})