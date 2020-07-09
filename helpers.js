const getUserByEmail = function(email, database) {
  let userID;
  Object.values(database).forEach(user => {
    if (user.email === email) {
      userID = user;
    } else {
      return undefined;
    }
  });
  return userID;
};

// filter funk only for userURL



const generateRandomString = function(n, string) {
  if (string && n === 0) return string;

  const randomIndex = Math.floor(Math.random() * Math.floor(35));
  const char = ['A', 'b', 'C', 'd', 'E', 'f', 'G', 'h', 'I', 'j', 'K', 'l', 'M', 'n', 'O', 'p', 'Q', 'r', 'S', 't', 'U', 'v', 'W', 'x', 'Y', 'z', '1', '0', '2', '3','4', '5', '6', '7', '8', '9'];
  const newString = string ? string + char[randomIndex] : char[randomIndex];
  return generateRandomString(n - 1, newString);
}

module.exports = { getUserByEmail, generateRandomString };