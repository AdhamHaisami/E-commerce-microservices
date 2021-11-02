const jwt = require('jsonwebtoken');

const authenticator = async (req, res, next) => {
  const token = req.headers['authorization'].split(' ')[1];
  jwt.verify(token, 'secret', (err, user) => {
    if (err) console.log(err);
    req.user = user;
    next();
  });
};

module.exports = authenticator;
