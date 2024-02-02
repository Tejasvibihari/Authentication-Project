import express from "express";
import bodyParser from "body-parser";
import mongoose, { Mongoose } from "mongoose";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";


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
  cokkie: {
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
    unique: true,

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
  // console.log(req.user);
  if (req.isAuthenticated()) {
    res.render("secrets.ejs");
  } else {
    res.redirect("/login");
  }
});

app.post('/register', async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.send('Email already exists. Try logging in.');
    }

    // Hash the password
    bcrypt.hash(password, saltRounds, async (err, hash) => {
      if (err) {
        console.error('Error hashing password:', err);
        return res.status(500).send('Internal Server Error');
      }

      // Create a new user
      const newUser = new User({ email, password: hash });

      // Save the new user to the database
      await newUser.save();

      // Log the result (optional)
      console.log('User registered:', newUser);

      // Log in the user and redirect to the secrets page
      req.login(newUser, (err) => {
        if (err) {
          console.log(err);
          return res.status(500).send('Internal Server Error');
        }
        res.redirect('/secrets');
      });
    });
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
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
