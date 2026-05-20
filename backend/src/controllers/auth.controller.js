import prisma from '../prisma/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendVerificationEmail } from '../utils/email.js';

export const register = async (req, res) => {
  try {
    const { fullName, username, email, phoneNumber, password } = req.body;
    
    // 1. Signup Validation
    if (!fullName || !username || !email || !phoneNumber || !password) {
      return res.status(400).json({ error: 'Harap isi semua kolom pendaftaran.' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Kata sandi minimal 6 karakter.' });
    }
    
    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email sudah terdaftar. Silakan gunakan email lain.' });
    }
    
    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username sudah digunakan. Silakan pilih username lain.' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 3. Create Active Account (isVerified: true by default, no email confirmation required)
    const user = await prisma.user.create({
      data: {
        fullName,
        username,
        email,
        phoneNumber,
        password: hashedPassword,
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      }
    });
    
    // 4. Generate JWT Token directly
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      
    res.status(201).json({
      message: 'Registrasi berhasil! ✨',
      token,
      user: {
        id: user.id,
        name: user.fullName, // backward compatibility
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        financialGoals: user.financialGoals,
        monthlyIncomeTarget: user.monthlyIncomeTarget,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
    }
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Email tidak terdaftar.' });
    
    // Check verification status
    if (!user.isVerified) {
      return res.status(403).json({ 
        error: 'Email belum diverifikasi', 
        isNotVerified: true, 
        message: 'Silakan verifikasi email Anda terlebih dahulu.' 
      });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Kata sandi salah.' });
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.fullName, // backward compatibility
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        financialGoals: user.financialGoals,
        monthlyIncomeTarget: user.monthlyIncomeTarget,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).send('Verification token is missing.');
    }
    
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
      }
    });
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    if (!user) {
      return res.redirect(`${frontendUrl}/verify-success?status=invalid`);
    }
    
    if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
      return res.redirect(`${frontendUrl}/verify-success?status=expired&email=${encodeURIComponent(user.email)}`);
    }
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      }
    });
    
    return res.redirect(`${frontendUrl}/verify-success?status=success`);
  } catch (error) {
    console.error('Error verifying email:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/verify-success?status=error`);
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email wajib diisi.' });
    }
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Email tidak ditemukan.' });
    }
    
    if (user.isVerified) {
      return res.status(400).json({ error: 'Email ini sudah diverifikasi.' });
    }
    
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); 
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpiry,
      }
    });
    
    sendVerificationEmail(email, user.fullName, verificationToken)
      .catch(err => console.error('Failed to send verification email:', err));
      
    res.json({ message: 'Email verifikasi telah dikirim ulang ✨' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
