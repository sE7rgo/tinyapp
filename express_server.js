const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieParser());


const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "user2RandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "userRandomID" },
  iwkcdr: { longURL: "https://www.ign.com", userID: "userRandomID" },
  iwoikr: { longURL: "https://www.imdb.com", userID: "userRandomID" }
};

// user registation form

const users = { 
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
}

function generateRandomString(n, string) {
  if (string && n === 0) return string;

  const randomIndex = Math.floor(Math.random() * Math.floor(35));
  const char = ['A', 'b', 'C', 'd', 'E', 'f', 'G', 'h', 'I', 'j', 'K', 'l', 'M', 'n', 'O', 'p', 'Q', 'r', 'S', 't', 'U', 'v', 'W', 'x', 'Y', 'z', '1', '0', '2', '3','4', '5', '6', '7', '8', '9'];
  const newString = string ? string + char[randomIndex] : char[randomIndex];
  return generateRandomString(n - 1, newString);
}

// filter funk only for userURL

function urlsForUser(id) {
  let userUrl = {};
  Object.keys(urlDatabase).forEach(shortUrl => {
    if (urlDatabase[shortUrl].userID === id) {
      userUrl[shortUrl] = urlDatabase[shortUrl];
    }
  })
  return userUrl;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//home page

app.get("/urls", (req, res) => {
  const userUrl = urlsForUser(req.cookies["user_id"]);
  console.log(urlDatabase)
  let templateVars = {
    urls: userUrl,
    user_id: req.cookies["user_id"]
  };
  res.render("urls_index", templateVars);
});

//register page

app.get("/urls/register", (req, res) => {
  let templateVars = {
    user_id: req.cookies["user_id"] 
  };
  res.render("urls_register", templateVars);
});

app.post("/urls/register", (req, res) => {
  const randomUserId = `user${generateRandomString(6)}`;
  if (req.body.email === '' && req.body.password === '') {
    return res.status(400).send(`Can't be empty field`);
  }
    Object.values(users).forEach(user => {
    //check if email exist
    console.log('user.email', user.email, 'req.body', req.body.email)
      if (user.email === req.body.email) {
        console.log('inside if =>>>>')
        return res.status(403).render('urls_register', { 
          error: 'Email is Already Registered', 
          email: null, 
          user_id: null 
        })
        //check if empty string
        //make a new user obj
    }

  })
  users[randomUserId] = {};
        users[randomUserId].id = randomUserId;
        users[randomUserId].email = req.body.email;
        users[randomUserId].password = req.body.password;
        return res.cookie('user_id', randomUserId).redirect('/urls');
})

  //handle login
  
  app.get('/urls/login', (req, res) => {
    let templateVars = {
      user_id: req.cookies["user_id"],
      email: null,
      error: null
    };
  res.render("urls_login", templateVars);
})

app.post('/urls/login', (req, res) => {
  const { email, password } = req.body;
  
  Object.values(users).forEach(user => {
    if ( user.email === email) {
      if (user.password === password) {
        return res.cookie('user_id', user.id).redirect('/urls');
      } else {
        //wrong pass
        return res.status(403).render('urls_login', { 
          error: 'Password mismatch', 
          email: email,
          user_id: null 
        });
      }
    }
  })
  //wrong email
  return res.status(403).render('urls_login', { 
    error: 'Incorrect email address', 
    email: null, 
    user_id: null 
  })
});


// handle logout

app.post('/urls/logout', (req, res) => {
  res.clearCookie('user_id', { path: '/' });
  res.redirect('/urls');
})

//new shortURL

app.post("/urls/new", (req, res) => {
  const shortUrl = generateRandomString(6);
  const userId = req.cookies['user_id'];
  // create new urlObj
  urlDatabase[shortUrl] = {};
  urlDatabase[shortUrl].longURL = req.body.longURL;
  urlDatabase[shortUrl].userID = userId;
  res.redirect(`/urls/${shortUrl}`)
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies['user_id']
  Object.values(users).forEach(user => {
    if (user.id === userId) {
      let templateVars = {
        shortURL: req.params.shortURL, 
        longURL:  urlDatabase[req.params.shortURL], 
        user_id: userId
      };
      return res.render("urls_new", templateVars);
    }
  })
  return res.redirect('/urls/login');
});

//redirect to original URL

app.get("/u/:shortURL", (req, res) => {
  res.redirect(`${urlDatabase[req.params.shortURL].longURL}`)
})

// short url page
app.get("/urls/:shortURL", (req, res) => {
  const userUrls = urlsForUser(req.cookies["user_id"]);
  const userUrl = userUrls[req.params.shortURL]
  let templateVars = { 
    shortURL: req.params.shortURL, 
    longURL:  userUrl.longURL, 
    user_id: req.cookies["user_id"]
  };
  res.render("urls_show", templateVars);
});

// chenge longUrl
app.post('/urls/:shortURL', (req, res) => {
  const userId = req.cookies['user_id'];
  const userUrls = urlsForUser(userId);
  const userUrl = userUrls[req.params.shortURL];
  console.log(userUrl)
  //check if user is maste :)
  if (userUrl.userID === userId) {
    userUrl.longURL = req.body.longURL;
    res.redirect('/urls');
  }
  res.status(403).send('403 Forbidden');
})

// delete url

app.post('/urls/:shortURL/delete', (req, res) => {
  const userId = req.cookies['user_id'];
  const shortURL = req.params.shortURL;
  const userUrls = urlsForUser(userId);
  //check if user is master :)
  if (shortURL in userUrls) {
	  delete urlDatabase[shortURL];
    res.redirect(`/urls`);
  }
  res.status(403).send('403 Forbidden');
})


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});