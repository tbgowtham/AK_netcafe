import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { isMongoConnected } from '../config/db.js';

// In-memory fallback database
const tempUsers = [];

// Signup Controller
export const signup = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();

    if (isMongoConnected) {
      // Check if user already exists in MongoDB
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists.' });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create the user
      const newUser = new User({
        email: normalizedEmail,
        password: hashedPassword,
        role: 'user'
      });

      await newUser.save();
    } else {
      // In-memory fallback
      const existingUser = tempUsers.find(u => u.email === normalizedEmail);
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists (In-Memory).' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      tempUsers.push({
        email: normalizedEmail,
        password: hashedPassword,
        role: 'user'
      });
      console.log(`[Backup In-Memory Store] Registered user: ${normalizedEmail}`);
    }

    res.status(201).json({
      success: true,
      message: 'Signup successful! You can now log in.',
      user: { email: normalizedEmail, role: 'user' }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login Controller
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    let user = null;

    if (isMongoConnected) {
      // Find the user by email in MongoDB
      user = await User.findOne({ email: normalizedEmail });
    } else {
      // Find user in-memory fallback
      user = tempUsers.find(u => u.email === normalizedEmail);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: { email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
