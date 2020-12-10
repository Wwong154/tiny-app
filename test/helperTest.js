const { assert } = require('chai');

const { getUserByEmail, checkUserMail} = require('../helper.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedOutput = "userRandomID";
    // Write your assert statement here
    assert.equal(expectedOutput, user)
  });
  it('should return false with invalid email', function() {
    const user = getUserByEmail("user1234@example.com", testUsers)
    const expectedOutput = false;
    // Write your assert statement here
    assert.equal(expectedOutput, user)
  });
});

describe('checkUserMail', function() {
  it('should return a email with valid id', function() {
    const user = checkUserMail("user2RandomID", testUsers)
    const expectedOutput = "user2@example.com";
    // Write your assert statement here
    assert.equal(expectedOutput, user)
  });
  it('should return false with invalid ID', function() {
    const user = checkUserMail("user12m", testUsers)
    const expectedOutput = false;
    // Write your assert statement here
    assert.equal(expectedOutput, user)
  });
});
