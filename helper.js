const generateRandomString = function() {
  return Math.random().toString(36).substring(4,10);
};

const checkUserMail = function(id, db) {
  if (db[id]) {
    return db[id].email;
  }
  return false;
};

const getUserByEmail = function(email, db) {
  const keys = Object.keys(db);
  for (const user of keys) {
    if (db[user].email === email) {
      return db[user].id;
    }
  }
  return false;
};

const urlsForUser = function(id, db) {
  const shortURL = Object.keys(db);
  let result = [];
  for (const url of shortURL) {
    if (db[url].userID === id) {
      result.push(url);
    }
  }
  return result;
};

module.exports = { 
  checkUserMail,
  generateRandomString,
  getUserByEmail,
  urlsForUser
}