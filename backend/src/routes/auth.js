import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import prisma from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', [
  body('name').trim().notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ message: 'Validation failed', errors: errors.array() });

  const { name, email, password } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(422).json({ message: 'Email already registered' });

  const user = await prisma.user.create({
    data: { name, email, password: await bcrypt.hash(password, 10) },
  });
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET);
  res.status(201).json({ data: { user: { id: user.id, name: user.name, email: user.email }, token } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET);
  res.json({ data: { user: { id: user.id, name: user.name, email: user.email }, token } });
});

router.post('/logout', authMiddleware, async (req, res) => {
  res.json({ message: 'Logged out' });
});

router.get('/user', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ data: { id: user.id, name: user.name, email: user.email } });
});

export default router;
