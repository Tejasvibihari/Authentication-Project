import express from "express";
import bodyParser from "body-parser";
import { Mongoose } from "mongoose";

const app = express();
const port = 3000;

// app.set("view engine", "ejs");
// mongodb connection
// Mongoose.connect(process.env.MONGODB_URI)
//   .then(() => {
//     console.log("Database connected");
//   })
//   .catch((err) => {
//     console.error(`Error connecting to database: ${err}`);
//   });


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

  console.log(email);
  console.log(password);


});

app.post("/login", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  console.log(email);
  console.log(password);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
