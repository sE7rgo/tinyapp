const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls/new", (req, res) => {
  const shortUrl = generateRandomString(6);
  urlDatabase[shortUrl] = req.body.longURL;
  res.redirect(`/urls/${shortUrl}`)
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/u/:shortURL", (req, res) => {
  res.redirect(`${urlDatabase[req.params.shortURL]}`)
})

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL:  urlDatabase[req.params.shortURL]};
  res.render("urls_show", templateVars);
});

//
app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
	urlDatabase[shortURL] = req.body.longURL;

  res.redirect('/urls');
})


app.post('/urls/:shortURL/delete', (req, res) => {
	const shortURL = req.params.shortURL;
	delete urlDatabase[shortURL];

  res.redirect(`/urls`)
})


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});