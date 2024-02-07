import express from "express";
import bodyParser from "body-parser";
import mongoose, { Mongoose } from "mongoose";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";


const app = express();
const port = 3000;
const saltRounds = 10;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(session({
  secret: "TOPSECRETWORD",
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
  },
}));

app.use(passport.initialize());
app.use(passport.session());


// mongodb connection
mongoose.connect("mongodb://localhost:27017/secretsDb")
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.error(`Error connecting to database: ${err}`);
  });

const users = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    // unique: true,

  },
  password: {
    type: String,
    required: true,
  }
});
const User = mongoose.model("User", users);



app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});
app.get("/secrets", (req, res) => {
  console.log(req.user);
  if (req.isAuthenticated()) {
    res.render("secrets.ejs");
  } else {
    res.redirect("/login");
  }
});

app.post('/register', async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  try {
    const checkResult = await User.findOne({ username: email });
    console.log(checkResult);
    if (checkResult === null) {
      if (password !== confirmPassword) {
        // res.send("Passwords do not match");
        const pas = "Passwords do not match";
        res.render("register.ejs", { passError: pas })
      } else {
        bcrypt.hash(password, saltRounds, async (err, hash) => {
          const newUser = new User({
            username: email,
            password: hash,
          });
          const user = newUser.save()
            .then(() => {
              console.log("Saved");

            })
            .catch((err) => {
              console.log(err);
            })
          console.log(`user: ${user}`);
          // res.json(savedUser);
          req.login(user, (err) => {
            if (err) {
              console.log(err);
            } else {
              res.redirect("/login");
            }
          });
        });
      }
    } else {
      res.send("User already exists");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
});



// Handle POST request to the /login endpoint
app.post('/login', passport.authenticate("local", {
  successRedirect: "/secrets",
  failureRedirect: "/login"
}))



passport.use(new Strategy(async function verify(username, password, cb) {
  try {
    // Find a user with the provided email in the database
    const user = await User.findOne({ username });
    // If no user is found with the provided email, send a response indicating user not found
    if (user === null) {
      return cb("User Not Found");
    } else {
      // Compare the provided password with the hashed password stored in the database
      bcrypt.compare(password, user.password, (err, result) => {
        // Handle any errors that might occur during password comparison
        if (err) {
          return cb(err);
        }
        // If the user exists and the password matches, render the secrets view
        if (user && result) {
          return cb(null, user);
        } else {
          // If the password doesn't match, log an error message
          return cb(null, false)
        }
      });
    }
  } catch (err) {
    // Handle any other errors that might occur during the database query
    console.log(err);
  }
}));

// passport.use("google", new GoogleStrategy({
//   clientID: "828699564503-ojrr8b1jodh5fha4ku45o5elfr6pgddc.apps.googleusercontent.com",
//   clientSecret: "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",
//   callbackURL: "http://localhost:3000/auth/google/index",

// }));



passport.serializeUser((user, cb) => {
  cb(null, user);
});

// Deserialize the user by finding the appropriate userId in the session and returning the associated
passport.deserializeUser((user, cb) => {
  cb(null, user);
});
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
