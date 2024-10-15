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

// ... existing routes ...

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

// ... rest of the server code ...

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});