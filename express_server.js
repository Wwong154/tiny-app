const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const  { checkIfVisited, checkUserMail, generateRandomString, getUserByEmail, urlsForUser } = require('./helper.js');
const app = express();
const PORT = 8080;
const salt = bcrypt.genSaltSync(10);

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['Willy Wonka']
}));
app.set("view engine", "ejs");
app.use(methodOverride('_method'));

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "ID1", visited: 0, visitor: [], visLog : [], created: Date(Date.now() * 1000).slice(4, 15) },
  sgq3y6: { longURL: "https://www.google.ca", userID: "ID1", visited: 0, visitor: [], visLog : [], created: Date(Date.now() * 1000).slice(4, 15) }
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

const guest = {};

app.get("/", (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  if (req.session.userID) {
    let keys = urlsForUser(req.session.userID, urlDatabase);
    const templateVars = { userEmail: checkUserMail(req.session.userID, users), urls: urlDatabase, keys: keys, err: req.session.error ? req.session.error : false };
    if (!keys.length) {
      templateVars.keys = false;
    }
    req.session.error = null;
    res.render("urls_index", templateVars);
  } else {
    res.status(403);
    const templateVars = { userEmail: checkUserMail(req.session.userID,  users), urls: urlDatabase, keys: '', err: req.session.error ? req.session.error : "you need to log in first"};
    req.session.error = null;
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  if (req.session.userID) {
    const templateVars = { userEmail: checkUserMail(req.session.userID, users), err: req.session.error ? req.session.error : false };
    req.session.error = null;
    res.render("urls_new", templateVars);
  } else {
    req.session.error += ". If you wish to create a link, please sign in to do so.";
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
  if (req.session.userID) {
    res.redirect('/urls');
  } else {
    const templateVars = { userEmail: checkUserMail(req.session.userID, users), err: false};
    res.render("register", templateVars);
  }
});

app.delete("/urls/:shortURL", (req, res) => {
  if (req.session.userID === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect(`/urls/`);
  } else {
    res.status(403);
    req.session.error = "You are not the owner of the url you try to access";
    res.redirect(`/urls/`);
  }
});

app.get("/login", (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
  } else {
    const templateVars = { userEmail: checkUserMail(req.session.userID, users), err: req.session.error ? req.session.error : false };
    req.session.error = null;
    res.render("login", templateVars);
  }
});

app.post("/login", (req, res) => {
  const userid = getUserByEmail(req.body.email, users);
  if (userid && bcrypt.compareSync(req.body.password, users[userid].password)) {// if password matched, log the user in
    req.session.userID = getUserByEmail(req.body.email, users);
    res.redirect(`/urls/`);
  } else if (userid) {// if password do not matched, shown error of not matching
    res.status(403);
    const templateVars = { userEmail: checkUserMail(req.session.userID, users), err: "The email and password combination does not match our record"};
    res.render("login", templateVars);
  } else {// if email doesn't exist, tell user
    res.status(403);
    const templateVars = { userEmail: checkUserMail(req.session.userID, users), err: "The email you entered is not valid"};
    res.render("login", templateVars);
  }
});

app.get("/logout", (req, res) => {
  req.session.userID = null;
  res.redirect(`/urls/`);
});

app.put("/urls/:shortURL", (req, res) => {
  if (req.session.userID === urlDatabase[req.params.shortURL].userID) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect(`/urls/`);
  } else {
    res.status(403);
    req.session.error = "You are not the owner of the url";
    res.redirect('/urls');
  }
});

app.post("/urls", (req, res) => {
  if (req.session.userID) {
    let shorten = generateRandomString();
    while (urlDatabase[shorten]) {
      shorten = generateRandomString();
    }
    urlDatabase[shorten] = { longURL: req.body.longURL, userID: req.session.userID, visited: 0, visitor: [], visLog : [], created: Date(Date.now() * 1000).slice(4, 15) };
    res.redirect(`/urls/${shorten}`);
  } else {
    res.status(403);
    req.session.error = "You have to sign in to create new url";
    res.redirect('/urls');
  }
});

app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] && req.session.userID === urlDatabase[req.params.shortURL].userID) {
    const templateVars = { userEmail: checkUserMail(req.session.userID, users), urlInfo: urlDatabase[req.params.shortURL], shortURL: req.params.shortURL, err: false };
    res.render("urls_show", templateVars);
  } else if (!urlDatabase[req.params.shortURL]) {
    req.session.error = "The link you entered does not exist";
    res.redirect(`/urls/new`);
  } else {
    res.status(403);
    const templateVars = { userEmail: checkUserMail(req.session.userID, users), shortURL: req.params.shortURL, err: true };
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404);
    req.session.error = "The link you try to access does not exist";
    res.redirect(`/urls/new`);
  } else {
    urlDatabase[req.params.shortURL].visited++;
    if (checkUserMail(req.session.userID, users)) {
      checkIfVisited(req.params.shortURL, req.session.userID, urlDatabase)
        ? undefined
        : urlDatabase[req.params.shortURL].visitor.push(req.session.userID);
      let log = req.session.userID + " has visited on " + Date(Date.now() * 1000);
      urlDatabase[req.params.shortURL].visLog.push(log);
    } else {
      if (req.session.guestID) {
        checkIfVisited(req.params.shortURL, req.session.guestID, urlDatabase)
          ? undefined
          : urlDatabase[req.params.shortURL].visitor.push(req.session.guestID);
      } else {
        let guestID = generateRandomString();
        while (guest[guestID]) {
          guestID = generateRandomString();
        }
        guest[guestID] = guestID;
        req.session.guestID = guestID;
        urlDatabase[req.params.shortURL].visitor.push(req.session.guestID);
      }
      let log = req.session.guestID + " has visited on " + Date(Date.now() * 1000);
      urlDatabase[req.params.shortURL].visLog.push(log);
    }
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
