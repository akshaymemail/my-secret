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
const GoogleStrategy = require('passport-google-oauth20').Strategy
const findOrCreate = require('mongoose-findorcreate')

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

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
// creating the connection with mongodb
mongoose.connect('mongodb://localhost:27017/userDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

// creating the schema
const schema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secrets : String
})

//adding the mongoose schema plugin
schema.plugin(passportLocalMongoose)

// adding the findOrCreate plugin
schema.plugin(findOrCreate)

// creating the the model
const User = mongoose.model('User', schema)

// usign passport to create strtegy
passport.use(User.createStrategy())

// creating passport to serialize and deserialize
passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

// listening the home router
app.get('/', function (req, res) {
    res.render('home')
})

// listening the auth/google route
app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }))

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
});

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
        User.find({secrets : {$ne : null}}, function (err, users) {
            if(err) {
                console.log(err)
            }else{
                res.render('secrets',{users : users})
            }
        }) 
    } else {
        // user is not authenticated
        res.redirect('/login')
    }
})

// listening the submit routes
app.get('/submit', function (req, res) {
    // checking if the user is authenticated or not
    if (req.isAuthenticated()) {
        // user is authenticated
        res.render('submit')
    } else {
        // user is not authenticated
        res.redirect('/login')
    }
})

// posting the submit route
app.post('/submit', function (req, res){

    // submit the secret to the database of logged in user
    User.findById(req.user._id, function (err, foundUser){
        // checking the error
        if(err) {
            // there was an error
            console.log(err)
        }else{
            // user found successfully
            foundUser.secrets = req.body.secret
            foundUser.save(function(){
                res.redirect('/secrets')
            })
        }
    })
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
            // user was registered now authenticating
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