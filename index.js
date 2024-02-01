import express from "express";
import bodyParser from "body-parser";
import mongoose, { Mongoose } from "mongoose";
import bcrypt from "bcrypt";


const app = express();
const port = 3000;
const saltRounds = 10;

app.set("view engine", "ejs");
// mongodb connection
mongoose.connect("mongodb://localhost:27017/secretsDb")
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.error(`Error connecting to database: ${err}`);
  });

const users = new mongoose.Schema({
  email: {
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

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;
  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.send('Email already exists. Try logging in.');
    }
    // Password Hashing
    bcrypt.hash(password, saltRounds, async (err, hash) => {
      if (err) {
        console.log("Error Hashing password:", err)
      } else {
        // Create a new user
        const newUser = new User({
          email: email,
          password: hash
        });
        await newUser.save();

        // Log the result (optional)
        console.log('User registered:', newUser);

        res.render('secrets.ejs'); // Render your success view
      }
    });
  } catch (err) {
    console.log(err);
  }
});


// Handle POST request to the /login endpoint
app.post('/login', async (req, res) => {
  // Extract the email and password from the request body
  const email = req.body.username;
  const loginPassword = req.body.password;
  try {
    // Find a user with the provided email in the database
    const user = await User.findOne({ email });
    // If no user is found with the provided email, send a response indicating user not found
    if (user === null) {
      res.send('User Not Found');
    } else {
      // Compare the provided password with the hashed password stored in the database
      bcrypt.compare(loginPassword, user.password, (err, result) => {
        // Handle any errors that might occur during password comparison
        if (err) {
          console.log('Error comparing Password', err);
        }
        // If the user exists and the password matches, render the secrets view
        if (user && result) {
          res.render('secrets.ejs');
        } else {
          // If the password doesn't match, log an error message
          console.log('Invalid Credentials');
        }
      });
    }
  } catch (err) {
    // Handle any other errors that might occur during the database query
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
