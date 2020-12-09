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
  const keys = Object.keys(users);
  for(const user of keys) {
    if (users[user].email === email){
      return users[user].id;
    }
  }
  return false;
}

function urlsForUser(id) {
  const shortURL = Object.keys(urlDatabase);
  let result = [];
  for(const url of shortURL) {
    if (urlDatabase[url].userID === id){
      result.push(url);
    }
  }
  return result;
}

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "ID1" },
  sgq3y6: { longURL: "https://www.google.ca", userID: "ID1" }
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
  },
  "ID3": {
    id: "ID3", 
    email: "user3@example.com", 
    password: "ABCD"
  }
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  if (req.cookies["user_id"]) {
    let keys = urlsForUser(req.cookies["user_id"]);
    const templateVars = { user_email: checkUserID(req.cookies["user_id"]), urls: urlDatabase, keys: keys, res: '', err: ''};
    if (!keys.length) {
      templateVars.keys = false;
    };
    res.render("urls_index", templateVars);
  } else {
    res.status(403);
    const templateVars = { user_email: checkUserID(req.cookies["user_id"]), urls: urlDatabase, keys: '', res: 403, err: 'Please login first!'};
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"]) {
    const templateVars = { user_email: checkUserID(req.cookies["user_id"]) };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.post("/register", (req, res) => {
  if (checkUserExist(req.body.email)) {
    res.status(400);
    const templateVars = { user_email: checkUserID(req.cookies["user_id"]), res: 400, err: "Email already registered, please use login instead"};
    res.render("register", templateVars);
  } else if (req.body.email && req.body.password){
    const id = generateRandomString()
    while (users[id]) {
      id = generateRandomString();
    }
    users[id] = {id: id, email: req.body.email, password: req.body.password};
    res.cookie("user_id",id)
    res.redirect(`/urls/`);
  } else {
    res.status(400);
    const templateVars = { user_email: checkUserID(req.cookies["user_id"]), res: 400, err: "Please enter BOTH email or password"};
    res.render("register", templateVars);
  }
});

app.get("/register", (req, res) => {
  const templateVars = { user_email: checkUserID(req.cookies["user_id"]), res: '', err: ''};
  res.render("register", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.cookies["user_id"] === urlDatabase[req.params.shortURL].userID) {
    console.log("Delete: " + req.params.shortURL);  // Log the POST request body to the console
    delete urlDatabase[req.params.shortURL];
    res.redirect(`/urls/`);
  } else {
    res.status(403);
    res.send("you are not the owner of this url")
  }
});

app.get("/login", (req, res) => {
  const templateVars = { user_email: checkUserID(req.cookies["user_id"]),res: '', err: ''};
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const userid = checkUserExist(req.body.email)
  if (userid && users[userid].password === req.body.password) {
    console.log(`New log in: ${userid}`);  // Log the POST request body to the console
    res.cookie("user_id",checkUserExist(req.body.email));
    res.redirect(`/urls/`);
  } else if (userid) {
    res.status(403);
    const templateVars = { user_email: checkUserID(req.cookies["user_id"]), res: 403, err: "The email and password combination does not match our record"};
    res.render("login", templateVars);
  } else {
    res.status(403);
    const templateVars = { user_email: checkUserID(req.cookies["user_id"]), res: 403, err: "The email you entered is not valid"};
    res.render("login", templateVars);
  }
});

app.get("/logout", (req, res) => {
  console.log(`User: ${checkUserID(req.cookies["user_id"])} has logged out`);  // Log the POST request body to the console
  res.clearCookie("user_id");
  res.redirect(`/urls/`);
});

app.post("/urls/:shortURL/update", (req, res) => {
  if (req.cookies["user_id"] === urlDatabase[req.params.shortURL].userID) {
    console.log(`Update: ${req.params.shortURL} to link to ${req.body.longURL}`);  // Log the POST request body to the console
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect(`/urls/`);
  } else {
    res.status(403);
    res.send("you are not the owner of this url")
  }
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let shorten = generateRandomString();
  while (urlDatabase[shorten]) {
    shorten = generateRandomString();
  }
  urlDatabase[shorten] = { longURL: req.body.longURL, userID: req.cookies.user_id };
  console.log(urlDatabase[shorten].userID)
  res.redirect(`/urls/${shorten}`);
});

app.get("/urls/:shortURL", (req, res) => {
  if (req.cookies["user_id"] === urlDatabase[req.params.shortURL].userID) {
    if (!urlDatabase[req.params.shortURL]){
      res.redirect(`/urls/new`)
    } else {
      const templateVars = { user_email: checkUserID(req.cookies["user_id"]), shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, res: '', err: '' };
      res.render("urls_show", templateVars);
    }
  } else {
    res.status(403)
    const templateVars = { user_email: checkUserID(req.cookies["user_id"]), shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, res: 403, err: 'Not owner of url' };
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === []){
    res.redirect(`/urls/new`)
  } else {
    let longurl = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longurl);
  }
});

app.get("/hello", (req, res) => { //no longer need, keep for gag
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
