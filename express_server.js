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


const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "user2RandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "userRandomID" },
  iwkcdr: { longURL: "https://www.ign.com", userID: "userRandomID" },
  iwoikr: { longURL: "https://www.imdb.com", userID: "userRandomID" }
};

const urlsForUser = function(id) {
  let userUrl = {};
  Object.keys(urlDatabase).forEach(shortUrl => {
    if (urlDatabase[shortUrl].userID === id) {
      userUrl[shortUrl] = urlDatabase[shortUrl];
    }
  });
  return userUrl;
};

// user registation form

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

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//home page//////////////////////////////////////////////////////////////////////////////

app.get("/urls", (req, res) => {
  const userUrl = urlsForUser(req.session.user_id);
  let templateVars = {
    urls: userUrl,
    user_id: req.session.user_id
  };
  res.render("urls_index", templateVars);
});

//register page/////////////////////////////////////////////////////////////////////////////

app.get("/urls/register", (req, res) => {
  let templateVars = {
    user_id: req.session.user_id
  };
  res.render("urls_register", templateVars);
});

app.post("/urls/register", (req, res) => {
  const { email, password } = req.body;
  const randomUserId = `user${generateRandomString(6)}`;
  const user = getUserByEmail(email, users);
  if (email === '' && password === '') {
    return res.status(400).send(`Can't be empty field`);
  }
  //check if email exist
  if (user) {
    return res.status(403).render('urls_register',
      {
        error: 'Email is Already Registered',
        email: null,
        user_id: null
      });

  }
  //create new user
  users[randomUserId] = {};
  users[randomUserId].id = randomUserId;
  users[randomUserId].email = req.body.email;
  //hash passw
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  users[randomUserId].password = hashedPassword;

  req.session.user_id = randomUserId;

  return res.redirect('/urls');
});

//handle login////////////////////////////////////////////////////////////////////////
  
app.get('/urls/login', (req, res) => {
  let templateVars = {
    user_id: req.session.user_id,
    email: null,
    error: null
  };
  res.render("urls_login", templateVars);
});

app.post('/urls/login', (req, res) => {

  const email = req.body.email;
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  const user = getUserByEmail(email, users);
  if (user) {
    if (bcrypt.compareSync(user.password, hashedPassword)) {
      req.session.user_id;
      return res.redirect('/urls');
    } else {
      //wrong pass
      return res.status(403).render('urls_login',
        {
          error: 'Password mismatch',
          email: email,
          user_id: null
        });
    }
  }
  //wrong email
  return res.status(403).render('urls_login', {
    error: 'Incorrect email address',
    email: null,
    user_id: null
  });
});


// handle logout

app.post('/urls/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

//new shortURL

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
      user_id: userId
    };
    return res.render("urls_new", templateVars);
  }
  return res.render('urls_login',
    {
      error: 'Authorization required',
      email: null,
      user_id: null
    });
});

//redirect to original URL

app.get("/u/:shortURL", (req, res) => {
  res.redirect(`${urlDatabase[req.params.shortURL].longURL}`);
});

// short url page
app.get("/urls/:shortURL", (req, res) => {
  const userUrls = urlsForUser(req.session.user_id);
  const userUrl = userUrls[req.params.shortURL];
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL:  userUrl.longURL,
    user_id: req.session.user_id
  };
  res.render("urls_show", templateVars);
});

// chenge longUrl
app.post('/urls/:shortURL', (req, res) => {
  const userId = req.session.user_id;
  const userUrls = urlsForUser(userId);
  const userUrl = userUrls[req.params.shortURL];

  //check if user is maste :)
  if (userUrl.userID === userId) {
    userUrl.longURL = req.body.longURL;
    res.redirect('/urls');
  }
  res.status(403).send('403 Forbidden');
});

// delete url

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