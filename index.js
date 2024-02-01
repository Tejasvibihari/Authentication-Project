import express from "express";
import bodyParser from "body-parser";
import mongoose, { Mongoose } from "mongoose";

const app = express();
const port = 3000;

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

    // Create a new user
    const newUser = new User({
      email: email,
      password: password
    });
    await newUser.save();

    // Log the result (optional)
    console.log('User registered:', newUser);

    res.render('secrets.ejs'); // Render your success view
  } catch (err) {
    console.log(err);
  }
});


app.post("/login", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;
  try {
    const existingemail = await User.findOne({ email });
    const existingPassword = await User.findOne({ password });
    if (existingemail === null) {
      res.send("User Not Found");
    }
    else {
      if (existingemail && existingPassword) {
        res.render("secrets.ejs");
      }
      else {
        res.send("Invalid Credentials");
      }
    }
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
