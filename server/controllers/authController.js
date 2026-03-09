const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const generateToken = require('../utils/generateToken');
const { findUserByEmail, createUser } = require('../services/authService');

const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    return next(new Error('Name, email and password are required'));
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    res.status(400);
    return next(new Error('User with this email already exists'));
  }

  const user = await createUser({ name, email, password, role });

  const token = generateToken(user._id);

  res.status(201).json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  });
});

const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    return next(new Error('Email and password are required'));
  }

  const user = await findUserByEmail(email);

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    return next(new Error('Invalid email or password'));
  }

  const token = generateToken(user._id);

  res.json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  });
});

module.exports = {
  register,
  login,
};

