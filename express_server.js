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

//redirect user base on if they loged in
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

//To render urls
app.get("/urls", (req, res) => {
  if (req.session.userID) { //if user logged in
    let keys = urlsForUser(req.session.userID, urlDatabase); // get keys of db to make for loop easier
    const templateVars = { userEmail: checkUserMail(req.session.userID, users), urls: urlDatabase, keys: keys, err: req.session.error ? req.session.error : false }; //error passed over from other part of programs? true, pass it on : false = false
    if (!keys.length) {
      templateVars.keys = false; //as keys is empty, it will return error, so added false if keys is empty
    }
    req.session.error = null; // clear errror
    res.render("urls_index", templateVars);
  } else {
    res.status(403); // return 403 as user is not login and have no premission
    const templateVars = { userEmail: checkUserMail(req.session.userID,  users), urls: urlDatabase, keys: '', err: req.session.error ? req.session.error : "you need to log in first"}; // error passed over from other part of programs? true, pass it on : false, show you need ot log in
    req.session.error = null; // clear errror
    res.render("urls_index", templateVars);
  }
});

//To get to create new link
app.get("/urls/new", (req, res) => {
  if (req.session.userID) { //if user logged in
    const templateVars = { userEmail: checkUserMail(req.session.userID, users), err: req.session.error ? req.session.error : false }; // any error ?
    req.session.error = null; // clear errror
    res.render("urls_new", templateVars);
  } else { //if user not logged in
    req.session.error += ". If you wish to create a link, please sign in to do so."; //create error
    res.redirect('/login'); // redirect to login
  }
});

//To register
app.post("/register", (req, res) => {
  if (getUserByEmail(req.body.email, users)) { //if use already register
    res.status(400);
    const templateVars = { userEmail: checkUserMail(req.session.userID, users), res: 400, err: "Email already registered, please use login instead"};
    res.render("register", templateVars); // No error cookie, cause it is the same page
  } else if (req.body.email && req.body.password) { // if all ok, create new user
    let id = generateRandomString();
    while (users[id]) { //probably not gonna happen, but just in case rand genereate the same id
      id = generateRandomString();
    }
    users[id] = {id: id, email: req.body.email, password: bcrypt.hashSync(req.body.password, salt)}; // create new user
    req.session.userID = id; //log them in, create cookies for session
    res.redirect(`/urls/`);
  } else { // if either field is not fill in
    res.status(400);
    const templateVars = { userEmail: checkUserMail(req.session.userID, users), res: 400, err: "Please enter BOTH email or password"};
    res.render("register", templateVars); // No error cookie, cause it is the same page
  }
});

//display the register page
app.get("/register", (req, res) => {
  if (req.session.userID) { //if loged in, take user back to urls
    res.redirect('/urls');
  } else { //if not login, display the page
    const templateVars = { userEmail: checkUserMail(req.session.userID, users), err: false}; //this page should have error cookie passed to, so err is set to false
    res.render("register", templateVars);
  }
});

//request to delete the urls of the entered shorturl (used methodoverride, so it is delete)
app.delete("/urls/:shortURL", (req, res) => {
  if (req.session.userID === urlDatabase[req.params.shortURL].userID) { // if user log in and is the owner of link, process request
    delete urlDatabase[req.params.shortURL];
    res.redirect(`/urls/`);
  } else { //else create cookie for error and pass it to the urls pages
    res.status(403);
    req.session.error = "You are not the owner of the url you try to access";
    res.redirect(`/urls/`);
  }
});

//display the log in page
app.get("/login", (req, res) => {
  if (req.session.userID) { //If user is logged in, redirect
    res.redirect('/urls');
  } else { //else display page for them sign in
    const templateVars = { userEmail: checkUserMail(req.session.userID, users), err: req.session.error ? req.session.error : false };
    req.session.error = null; //clear error cookies after it passed to html
    res.render("login", templateVars);
  }
});

//request to login
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

//get log out request
app.get("/logout", (req, res) => {
  req.session.userID = null; // clear userid
  res.redirect(`/urls/`);
});

//request to update shortURL
app.put("/urls/:shortURL", (req, res) => {
  if (req.session.userID === urlDatabase[req.params.shortURL].userID) { // if owner, process
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect(`/urls/`);
  } else { //else reject and set error
    res.status(403);
    req.session.error = "You are not the owner of the url";
    res.redirect('/urls');
  }
});

//request to make new link
app.post("/urls", (req, res) => {
  if (req.session.userID) { // if logged in, process
    let shorten = generateRandomString();
    while (urlDatabase[shorten]) { // again probably not gonna happen, but check if dup just in case
      shorten = generateRandomString();
    }
    urlDatabase[shorten] = { longURL: req.body.longURL, userID: req.session.userID, visited: 0, visitor: [], visLog : [], created: Date(Date.now() * 1000).slice(4, 15) };
    res.redirect(`/urls/${shorten}`);
  } else { // if not logged in reject
    res.status(403);
    req.session.error = "You have to sign in to create new url";
    res.redirect('/urls');
  }
});

//display detail of shortURL for owner
app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] && req.session.userID === urlDatabase[req.params.shortURL].userID) { // if owner, process
    const templateVars = { userEmail: checkUserMail(req.session.userID, users), urlInfo: urlDatabase[req.params.shortURL], shortURL: req.params.shortURL, err: false };
    res.render("urls_show", templateVars);
  } else if (!urlDatabase[req.params.shortURL]) { //if link not exist, make error
    req.session.error = "The link you entered does not exist";
    res.redirect(`/urls/new`);
  } else { //if user not logged in, display err, detail will be shown on html.
    res.status(403);
    const templateVars = { userEmail: checkUserMail(req.session.userID, users), shortURL: req.params.shortURL, err: true };
    res.render("urls_show", templateVars);
  }
});

//a link to auto direct user to the longURL
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase.hasOwnProperty(req.params.shortURL)) { //if link not exist, make err
    res.status(404);
    req.session.error = "The link you try to access does not exist";
    res.redirect(`/urls/new`);
  } else { //if link exist
    urlDatabase[req.params.shortURL].visited++;// increase link visited count
    if (checkUserMail(req.session.userID, users)) { //check if user is register user
      checkIfVisited(req.params.shortURL, req.session.userID, urlDatabase) //check if user used this for first time or not, push ID to array if he is
        ? undefined
        : urlDatabase[req.params.shortURL].visitor.push(req.session.userID);
      let log = req.session.userID + " has visited on " + Date(Date.now() * 1000); //create log of visit id and time
      urlDatabase[req.params.shortURL].visLog.push(log);
    } else { //if person is guest
      if (req.session.guestID) { // if this person visited as guest before
        checkIfVisited(req.params.shortURL, req.session.guestID, urlDatabase) //check if user used this for first time or not, push ID to array if he is
          ? undefined
          : urlDatabase[req.params.shortURL].visitor.push(req.session.guestID);
      } else { //if person use site for first time
        let guestID = generateRandomString(); // make guest ID
        while (guest[guestID]) {
          guestID = generateRandomString();
        }
        guest[guestID] = guestID; //store guest ID to prevent double log
        req.session.guestID = guestID; //make guestID cookie
        urlDatabase[req.params.shortURL].visitor.push(req.session.guestID);
      }
      let log = req.session.guestID + " has visited on " + Date(Date.now() * 1000);
      urlDatabase[req.params.shortURL].visLog.push(log); //make & push log of visit
    }
    let longurl = urlDatabase[req.params.shortURL].longURL;
    let header = longurl.slice(0,9).toLowerCase();
    if (header.includes('http://') || header.includes('https://')) {
      res.redirect(longurl);
    } else {
      res.redirect('http://' + longurl);
    }
  }
});

app.get("/hello", (req, res) => { //no longer need, keep for gag
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
