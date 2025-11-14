const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'; // ideally in .env

// Register a new user
async function registerUser(userData) {
  const { firstName, lastName, email, password } = userData;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists with this email');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const newUser = new User({
    firstName,
    lastName,
    email,
    password: hashedPassword
  });

  await newUser.save();

  // Hide password when returning user
  const { password: _, ...userWithoutPassword } = newUser.toObject();
  return userWithoutPassword;
}

// Login user and return JWT, firstName, lastName, and role
async function loginUser(credentials) {
  const { email, password } = credentials;

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

  return { 
    token,
    _id: user._id,
    firstName: user.firstName, 
    lastName: user.lastName, 
    email: user.email,
    role: user.role 
  };
}

// Get user by ID (without password)
async function getUserById(id) {
  const user = await User.findById(id).select('-password');
  return user;
}

// Update user info
async function updateUser(id, updateData) {
  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  }

  const updatedUser = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  }).select('-password');

  return updatedUser;
}

// Delete user
async function deleteUser(id) {
  await User.findByIdAndDelete(id);
}

// Get all users (without passwords)
async function getAllUsers() {
  const users = await User.find({}).select('-password');
  return users;
}

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  updateUser,
  deleteUser,
  getAllUsers
};
