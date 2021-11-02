const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const User = require('./user');

const app = express();

app.use(express.json());

// Connect to DB
mongoose.connect(
  'mongodb://localhost/auth-service',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => {
    console.log(`Auth-service DB connected`);
  }
);

// Register Route
app.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
  const userExist = await User.findOne({ email });

  if (userExist) {
    return res.json({ message: 'User already exist' });
  }
  const newUser = new User({
    name,
    email,
    password,
  });
  newUser.save();
  return res.json({ newUser, status: '201' });
});

// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  // check if user exist
  if (!user) {
    return res.json('User does not exist');
  }

  //check if password is correct
  if (password !== user.password) {
    return res.json({ message: 'Password is incorrect' });
  }

  const payload = { email, name: user.name };
  jwt.sign(payload, 'secret', (err, token) => {
    if (err) console.log(err);
    return res.json({ token });
  });
});

const PORT = process.env.PORT_AUTH || 7070;

app.listen(PORT, () => {
  console.log(`AUTH-SERVICE IS LIVE ON ${PORT}`);
});
