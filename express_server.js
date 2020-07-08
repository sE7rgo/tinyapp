const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieParser());


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"] 
  };
  res.render("urls_index", templateVars);
});

//register page

app.get("/urls/register", (req, res) => {
  let templateVars = {
    username: req.cookies["username"] 
  };
  res.render("urls_register", templateVars);
});

app.post("/urls/register", (req, res) => {
  const randomUserId = `user${generateRandomString(6)}`;

    Object.values(users).forEach(user => {
    //check if email exist
    if (user.email !== req.body.email) {
      //check if empty string
      if (req.body.email !== '' && req.body.password !== '') {
        //make a new user obj
        users[randomUserId] = {};
        users[randomUserId].id = randomUserId;
        users[randomUserId].email = req.body.email;
        users[randomUserId].password = req.body.password;

        return res.cookie('username', randomUserId).redirect('/urls');
      } else {
        return res.status(400).send(`Can't be empty field`);
      }
    } else {
      return res.status(400).send('email already exist');
    }
  })
})

  //handle login
  
  app.get('/urls/login', (req, res) => {
    let templateVars = {
      username: req.cookies["username"] 
    };
  res.render("urls_login", templateVars);
})

app.post('/urls/login', (req, res) => {
  const { email, password } = req.body;
  
  Object.values(users).forEach(user => {
    if ( user.email === email) {
      if (user.password === password) {
        return res.cookie('username', user.id).redirect('/urls');
      } else {
        return res.render('/urls/login', { error: 'Password mismatch', email: email })
      }
    } else {
      return res.render('/urls/login', { error: 'Wrong Email' });
    }
  })
});


// handle logout

app.post('/urls/logout', (req, res) => {
  const username = req.cookies["username"];
  res.clearCookie('username', { path: '/' });
  res.redirect('/urls');
})

//new shortURL

app.post("/urls/new", (req, res) => {
  const shortUrl = generateRandomString(6);
  urlDatabase[shortUrl] = req.body.longURL;
  res.redirect(`/urls/${shortUrl}`)
});

app.get("/urls/new", (req, res) => {
  let templateVars = { 
    shortURL: req.params.shortURL, 
    longURL:  urlDatabase[req.params.shortURL], 
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

//redirect to original URL

app.get("/u/:shortURL", (req, res) => {
  res.redirect(`${urlDatabase[req.params.shortURL]}`)
})

// short url page
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { 
    shortURL: req.params.shortURL, 
    longURL:  urlDatabase[req.params.shortURL], 
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});

//
app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
	urlDatabase[shortURL] = req.body.longURL;

  res.redirect('/urls');
})

// delete url

app.post('/urls/:shortURL/delete', (req, res) => {
	const shortURL = req.params.shortURL;
	delete urlDatabase[shortURL];

  res.redirect(`/urls`)
})


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});