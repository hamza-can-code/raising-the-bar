// server/controllers/authController.js

const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const addToBrevoList = require('../utils/addToBrevoList');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  console.log('🔐 registerUser called with body:', req.body);
  try {
    const { email, password, isFree1Week } = req.body;

    // 1️⃣ Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // 2️⃣ Prevent duplicate emails
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 3️⃣ Create & respond
    const user = await User.create({ email, password });
    if (isFree1Week) {
      await addToBrevoList(email);
    }
    return res.status(201).json({
      _id:     user._id,
      email:   user.email,
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Error in registerUser:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login a user & get a JWT
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  console.log('🔑 loginUser called with body:', req.body);
  try {
    const { email, password } = req.body;

    // 1️⃣ Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // 2️⃣ Check user existence
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'No account found with that email' });
    }

    // 3️⃣ Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'That password is incorrect' });
    }

    // 4️⃣ Sign and return JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    return res.json({
      token,
      user: {
        _id: user._id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error in loginUser:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};