const User = require('../models/User');

const findUserByEmail = (email) => {
  return User.findOne({ email }).select('+password');
};

const createUser = (data) => {
  const user = new User(data);
  return user.save();
};

module.exports = {
  findUserByEmail,
  createUser,
};

