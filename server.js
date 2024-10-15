import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Middleware to check database connection
app.use(async (req, res, next) => {
  try {
    await prisma.$connect();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Unable to connect to the database. Please try again later.' });
  }
});

// Modify the login route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    
    if (userCount === 0) {
      return res.status(404).json({ error: 'No users exist. Please create an admin account.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (user && await bcrypt.compare(password, user.password)) {
      res.json({ email: user.email, isAdmin: user.isAdmin });
    } else {
      res.status(401).json({ error: 'Invalid credentials. Please check your email and password.' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred during login', details: error.message });
  }
});

// Add a new route to check if any users exist
app.get('/api/users/check', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    res.json({ exists: userCount > 0 });
  } catch (error) {
    console.error('Error checking user existence:', error);
    res.status(500).json({ error: 'An error occurred while checking user existence', details: error.message });
  }
});

// Add a route to create an admin user
app.post('/api/admin/create', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userCount = await prisma.user.count();
    console.log('User count before admin creation:', userCount);
    
    if (userCount > 0) {
      return res.status(400).json({ error: 'Admin user already exists. Cannot create another admin.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        isAdmin: true,
      },
    });

    console.log('New admin created:', newAdmin.email);
    res.status(201).json({ message: 'Admin user created successfully' });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ error: 'An error occurred while creating the admin user', details: error.message });
  }
});

// Updated route for claim creation with improved error handling
app.post('/api/claims', async (req, res) => {
  try {
    console.log('Received claim data:', req.body);
    const newClaim = await prisma.claim.create({
      data: {
        ...req.body,
        status: 'Pending',
      },
    });
    console.log('New claim created:', newClaim);
    res.status(201).json(newClaim);
  } catch (error) {
    console.error('Error creating claim:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'A claim with this order number already exists.' });
    } else {
      res.status(500).json({ error: 'An error occurred while creating the claim', details: error.message });
    }
  }
});

// Catch-all route to serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
