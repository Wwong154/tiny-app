const express = require("express");
const {inspect} = require('util');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

function generateRandomString() {
  return Math.random().toString(36).substring(4,10);
}

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "user1": {
    id: "ID1", 
    email: "user@example.com", 
    password: "1234"
  },
 "user2": {
    id: "ID2", 
    email: "user2@example.com", 
    password: "abcd"
  }
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
    const templateVars = { username: req.cookies["username"], urls: urlDatabase };
    res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

app.post("/register", (req, res) => {
  console.log(req.body.password)
  const templateVars = { username: req.cookies["username"] };
  res.render("urls_register", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render("urls_register", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  console.log("Delete: " + req.params.shortURL);  // Log the POST request body to the console
  delete urlDatabase[req.params.shortURL];
  res.redirect(`http://localhost:8080/urls/`);
});

app.post("/login", (req, res) => {
  console.log(`New log in: ${req.body.username}`);  // Log the POST request body to the console
  res.cookie("username",req.body.username);
  res.redirect(`http://localhost:8080/urls/`);
});

app.post("/logout", (req, res) => {
  console.log(`User has logged out`);  // Log the POST request body to the console
  res.clearCookie("username");
  res.redirect(`http://localhost:8080/urls/`);
});

app.post("/urls/:shortURL/update", (req, res) => {
  console.log(`Update: ${req.params.shortURL} to link to ${req.body.longURL}`);  // Log the POST request body to the console
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect(`http://localhost:8080/urls/`);
});


app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let shorten = generateRandomString();
  while (urlDatabase[shorten]) {
    shorten = generateRandomString();
  }
  urlDatabase[shorten] = req.body.longURL;
  res.redirect(`http://localhost:8080/urls/${shorten}`);
});

app.get("/urls/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]){
  res.redirect(`http://localhost:8080/urls/new`)
  } else {
    const templateVars = { username: req.cookies["username"], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]){
    res.redirect(`http://localhost:8080/urls/new`)
  } else {
    const longURL = urlDatabase[req.params.shortURL];
    res.redirect(longURL);
  }
});

app.get("/hello", (req, res) => { //no longer need, keep for gag
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
