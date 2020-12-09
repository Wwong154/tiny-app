const express = require("express");
const {inspect} = require('util');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

function generateRandomString() {
  return Math.random().toString(36).substring(4,10);
}

function checkUserID(id) {
  if (users[id]) {
    return users[id].email;
  }
  return false;
}

function checkUserExist(email) {
  const keys = Object.keys(users)
  for(const user of keys) {
    if (users[user].email === email)
    {
      return users[user].id;
    }
  }
  return false;
}
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "ID1": {
    id: "ID1", 
    email: "user@example.com", 
    password: "1234"
  },
 "ID2": {
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
    const templateVars = { user_email: checkUserID(req.cookies["user_id"]), urls: urlDatabase };
    res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user_email: checkUserID(req.cookies["user_id"]) };
  res.render("urls_new", templateVars);
});

app.post("/register", (req, res) => {
  if (checkUserExist(req.body.email)) {
    res.status(400);
    res.send("Email already registered, please use log in instead");
  } else if (req.body.email && req.body.password){
    const id = generateRandomString()
    while (users[id]) {
      id = generateRandomString();
    }
    users[id] = {id: id, email: req.body.email, password: req.body.password};
    res.cookie("user_id",id)
    res.redirect(`http://localhost:8080/urls/`);
  } else {
    res.status(400);
    res.send("Please enter BOTH email or password");
  }
});

app.get("/register", (req, res) => {
  const templateVars = { user_email: checkUserID(req.cookies["user_id"]) };
  res.render("register", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  console.log("Delete: " + req.params.shortURL);  // Log the POST request body to the console
  delete urlDatabase[req.params.shortURL];
  res.redirect(`http://localhost:8080/urls/`);
});

app.get("/login", (req, res) => {
  const templateVars = { user_email: checkUserID(req.cookies["user_id"]) };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const userEmail = checkUserExist(req.body.email)
  if (userEmail) {
    console.log(`New log in: ${userEmail}`);  // Log the POST request body to the console
    res.cookie("user_id",checkUserExist(req.body.email));
    res.redirect(`http://localhost:8080/urls/`);
  } else {
    res.redirect(`http://localhost:8080/urls/`);
  }
});

app.get("/logout", (req, res) => {
  console.log(`User: ${checkUserID(req.cookies["user_id"])} has logged out`);  // Log the POST request body to the console
  res.clearCookie("user_id");
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
    const templateVars = { user_email: checkUserID(req.cookies["user_id"]), shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
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
