const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override')
const  { checkUserMail, generateRandomString, getUserByEmail, urlsForUser } = require('./helper.js');
const app = express();
const PORT = 8080; 
const salt = bcrypt.genSaltSync(10);

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['Willy Wonka']
}));
app.set("view engine", "ejs");
app.use(methodOverride('_method'))

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "ID1" },
  sgq3y6: { longURL: "https://www.google.ca", userID: "ID1" }
};

const users = {
  "ID1": {
    id: "ID1",
    email: "user@example.com",
    password: bcrypt.hashSync("1234", salt)
  },
  "ID2": {
    id: "ID2",
    email: "user2@example.com",
    password: bcrypt.hashSync("abcd", salt)
  },
  "ID3": {
    id: "ID3",
    email: "user3@example.com",
    password: bcrypt.hashSync("ABCD", salt)
  }
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  if (req.session.userID) {
    let keys = urlsForUser(req.session.userID, urlDatabase);
    const templateVars = { userEmail: checkUserMail(req.session.userID, users), urls: urlDatabase, keys: keys, res: '', err: ''};
    if (!keys.length) {
      templateVars.keys = false;
    }
    res.render("urls_index", templateVars);
  } else {
    res.status(403);
    const templateVars = { userEmail: checkUserMail(req.session.userID,  users), urls: urlDatabase, keys: '', res: 403, err: 'Please login first!'};
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  if (req.session.userID) {
    const templateVars = { userEmail: checkUserMail(req.session.userID, users) };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.post("/register", (req, res) => {
  if (getUserByEmail(req.body.email, users)) {
    res.status(400);
    const templateVars = { userEmail: checkUserMail(req.session.userID, users), res: 400, err: "Email already registered, please use login instead"};
    res.render("register", templateVars);
  } else if (req.body.email && req.body.password) {
    let id = generateRandomString();
    while (users[id]) {
      id = generateRandomString();
    }
    users[id] = {id: id, email: req.body.email, password: bcrypt.hashSync(req.body.password, salt)};
    req.session.userID = id;
    res.redirect(`/urls/`);
  } else {
    res.status(400);
    const templateVars = { userEmail: checkUserMail(req.session.userID, users), res: 400, err: "Please enter BOTH email or password"};
    res.render("register", templateVars);
  }
});

app.get("/register", (req, res) => {
  const templateVars = { userEmail: checkUserMail(req.session.userID, users), res: '', err: ''};
  res.render("register", templateVars);
});

app.delete("/urls/:shortURL", (req, res) => {
  if (req.session.userID === urlDatabase[req.params.shortURL].userID) {
    console.log("Delete: " + req.params.shortURL);  // Log the POST request body to the console
    delete urlDatabase[req.params.shortURL];
    res.redirect(`/urls/`);
  } else {
    res.status(403);
    res.send("you are not the owner of this url");
  }
});

app.get("/login", (req, res) => {
  const templateVars = { userEmail: checkUserMail(req.session.userID, users),res: '', err: ''}; //get is always first try, so no error
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const userid = getUserByEmail(req.body.email, users);
  if (userid && bcrypt.compareSync(req.body.password, users[userid].password)) {// if password matched, log the user in
    console.log(`New log in: ${userid}`);  // Log the POST request body to the console
    req.session.userID = getUserByEmail(req.body.email, users);
    res.redirect(`/urls/`);
  } else if (userid) {// if password do not matched, shown error of not matching
    res.status(403);
    const templateVars = { userEmail: checkUserMail(req.session.userID, users), res: 403, err: "The email and password combination does not match our record"};
    res.render("login", templateVars);
  } else {// if email doesn't exist, tell user
    res.status(403);
    const templateVars = { userEmail: checkUserMail(req.session.userID, users), res: 403, err: "The email you entered is not valid"};
    res.render("login", templateVars);
  }
});

app.get("/logout", (req, res) => {
  console.log(`User: ${checkUserMail(req.session.userID, users)} has logged out`);  // Log the POST request body to the console
  delete req.session.userID;
  res.redirect(`/urls/`);
});

app.put("/urls/:shortURL", (req, res) => {
  if (req.session.userID === urlDatabase[req.params.shortURL].userID) {
    console.log(`Update: ${req.params.shortURL} to link to ${req.body.longURL}`);  // Log the POST request body to the console
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect(`/urls/`);
  } else {
    res.status(403);
    res.send("you are not the owner of this url");
  }
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let shorten = generateRandomString();
  while (urlDatabase[shorten]) {
    shorten = generateRandomString();
  }
  urlDatabase[shorten] = { longURL: req.body.longURL, userID: req.session.userID };
  console.log(urlDatabase[shorten].userID);
  res.redirect(`/urls/${shorten}`);
});

app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] && req.session.userID === urlDatabase[req.params.shortURL].userID) {
      const templateVars = { userEmail: checkUserMail(req.session.userID, users), shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, res: '', err: '' };
      res.render("urls_show", templateVars);
  } else if (!urlDatabase[req.params.shortURL]) {
    res.redirect(`/urls/new`);
  } else {
    res.status(403);
    const templateVars = { userEmail: checkUserMail(req.session.userID, users), shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, res: 403, err: 'Not owner of url' };
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === []) {
    res.redirect(`/urls/new`);
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
