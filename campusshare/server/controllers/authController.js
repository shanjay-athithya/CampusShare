import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    // Validation
    if (!name || !email || !password || !department) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, password, department' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email already exists' 
      });
    }

    // Create new user (password will be hashed by pre-save hook)
    const user = new User({
      name,
      email,
      password,
      department,
      role: 'user' // default role
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Return user data (without password) and token
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors 
      });
    }

    res.status(500).json({ 
      error: 'Internal server error during registration' 
    });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Verify password
    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Return user data (without password) and token
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error during login' 
    });
  }
};

// GET /api/auth/me - Get current user profile
export const getProfile = async (req, res) => {
  try {
    // User is attached by authMiddleware
    const user = req.user;
    
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
};
