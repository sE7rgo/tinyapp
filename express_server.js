const { getUserByEmail } = require('./helpers');

const { generateRandomString } = require('./helpers');
const express = require("express");
const cookieSession = require('cookie-session');
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));


app.use(cookieSession({
  name: 'session',
  keys: ['qwertasknxkcoiwokjsadkjhsad']
}));

const bcrypt = require('bcrypt');
const { response } = require('express');
const saltRounds = 10;

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "user2RandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "userRandomID" },
  iwkcdr: { longURL: "https://www.ign.com", userID: "userRandomID" },
  iwoikr: { longURL: "https://www.imdb.com", userID: "userRandomID" }
};

//----------------------display only users urls------------------
const urlsForUser = function(id) {
  let userUrl = {};
  Object.keys(urlDatabase).forEach(shortUrl => {
    if (urlDatabase[shortUrl].userID === id) {
      userUrl[shortUrl] = urlDatabase[shortUrl];
    }
  });
  return userUrl;
};


const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2b$10$xFX1l79O0DABGREO3jg.dOnngpDvHZBP6VUmRzM2lDm6M.aQ/t6Au"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2b$10$/qVwp3Z7RZBYNqTzdUsRgezGo.U/nQmcz24yFyGs/y9RFZWOXwRAy"
  }
};

//----------------------root page--------------------------------

app.get("/", (req, res) => {
  if (!req.session.user_id){
    return res.redirect('/login');
  } else {
    return res.redirect('/urls');
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//----------------------home page--------------------------------

app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const userUrl = urlsForUser(userId);
  if (userId in users) {
  let templateVars = {
    urls: userUrl,
    email: users[userId].email
  };
  res.render("urls_index", templateVars);
} else {
  return res.status(403).render('login',
    {
      error: 'Authorization required, please login',
      email: null,
    });
}
});

//----------------------registration page-------------------------

app.get("/register", (req, res) => {
  if (!req.session.user_id){
    let templateVars = {
      email: null,
      error: null
    };
    res.render("register", templateVars);
  } else {
    return res.redirect('/urls');
  }
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const randomUserId = `user${generateRandomString(6)}`;//generate random user_id
  const user = getUserByEmail(email, users);//existing user
  if (email === '' || password === '') {
    return res.status(400).render('register', {
      error: `Can't be empty field`,
      email: null,
    });
  }
  if (user) {// check if email already exist
    return res.status(400).render('register', {
      error: `Email is Already Registered`,
      email: null,
    });
  } else {// create new user obj
    users[randomUserId] = {};
    users[randomUserId].id = randomUserId;
    users[randomUserId].email = req.body.email;

    const hashedPassword = bcrypt.hashSync(req.body.password, saltRounds);//hash password
    users[randomUserId].password = hashedPassword;
  
    req.session.user_id = randomUserId;
  
    return res.redirect('/urls');
  }
});

//----------------------login page--------------------------------  

app.get('/login', (req, res) => {
  let templateVars = {
    email: null,
    error: null,
  };
  res.render("login", templateVars);
});

app.post('/login', (req, res) => {

  const { email, password } = req.body;
  const user = getUserByEmail(email, users);//existing user
  if (user) {
    if (bcrypt.compareSync(password, user.password)) {
      req.session.user_id = user.id;
      return res.redirect('/urls');
    } else {
      //wrong pass
      return res.status(403).render('login',
        {
          error: 'Password mismatch',
          email: email,
        });
    }
  } 
  //wrong email
  return res.status(403).render('login', {
    error: 'The Email Address field must contain a valid email address',
    email: null,
  });
});


//---------------------- logout --------------------------------

app.post('/logout', (req, res) => {
  req.session.user_id = null;
  res.redirect('/login');
});

//----------------------create new shortURL----------------------

app.post("/urls/new", (req, res) => {
  const shortUrl = generateRandomString(6);
  const userId = req.session.user_id;
  // create new urlObj
  urlDatabase[shortUrl] = {};
  urlDatabase[shortUrl].longURL = req.body.longURL;
  urlDatabase[shortUrl].userID = userId;
  res.redirect(`/urls/${shortUrl}`);
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  if (userId in users) {
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL:  urlDatabase[req.params.shortURL],
      user_id: userId,
      email: users[userId].email
    };
    return res.render("urls_new", templateVars);
  }
  return res.render('login',
    {
      error: 'Authorization required, please login',
      email: null,
    });
});

//----------------------redirect to original longURL----------------

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    res.redirect(`${urlDatabase[req.params.shortURL].longURL}`);
  } else {
    res.status(400).send('Bad Request');
  }
});

//----------------------shortURL page--------------------------------

app.get("/urls/:shortURL", (req, res) => {
  const userUrls = urlsForUser(req.session.user_id);
  const userUrl = userUrls[req.params.shortURL];
  if (userUrl) {
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL:  userUrl.longURL,
      email: users[req.session.user_id].email
    };
    res.render("urls_show", templateVars);
  } else {
    res.status(403).send('403 Forbidden');
  }
});

//----------------------modify longURL--------------------------------

app.post('/urls/:shortURL', (req, res) => {
  const userId = req.session.user_id;
  const userUrls = urlsForUser(userId);
  const userUrl = userUrls[req.params.shortURL];

  //check if user is master :)
  if (userUrl.userID === userId) {
    userUrl.longURL = req.body.longURL;
    res.redirect('/urls');
  }
  res.status(403).send('403 Forbidden');
});

//----------------------delete shortURL--------------------------------

app.post('/urls/:shortURL/delete', (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;
  const userUrls = urlsForUser(userId);
  //check if user is master :)
  if (shortURL in userUrls) {
    delete urlDatabase[shortURL];
    res.redirect(`/urls`);
  }
  res.status(403).send('403 Forbidden');
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});