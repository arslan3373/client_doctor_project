import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import { existsSync, mkdirSync } from 'fs';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import Doctor from './models/Doctor.js';
import Appointment from './models/Appointment.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const JWT_SECRET="arslan"
// Import routes and utilities
import videoRoutes from './videoRoutes.js';
import { initializeWebSocket } from './websocket.js';
import config from './config.js';

// Create uploads directory if it doesn't exist
if (!existsSync(config.UPLOAD_DIR)) {
  mkdirSync(config.UPLOAD_DIR, { recursive: true });
}

const app = express();
const server = createServer(app);

// Initialize WebSocket server
const io = initializeWebSocket(server);
app.set('io', io);

// Middleware
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(`/${config.UPLOAD_DIR}`, express.static(config.UPLOAD_DIR));

// Connect to MongoDB
connectDB();

// Make io instance available in routes
app.set('io', io);

// Email configuration
const transporter = nodemailer.createTransport({
  service: config.EMAIL_SERVICE,
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS
  }
});

// File upload configuration with validation
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  },
  fileFilter: (req, file, cb) => {
    if (config.ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'), false);
    }
  }
});

const upload = multer({
  storage,
  limits: { fileSize: config.MAX_FILE_SIZE }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Email configuration for development using Ethereal
const emailConfig = {
  isEnabled: true,
  transporter: nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'amelia.hilpert@ethereal.email',
      pass: 'uYRt75ypHGyWvS6hgK'
    }
  })
};

// Verify email configuration
emailConfig.transporter.verify((error) => {
  if (error) {
    console.error('Ethereal email connection error:', error);
    emailConfig.isEnabled = false;
  } else {
    console.log('Ethereal email server is ready to send messages');
    console.log('Test emails will be sent to: amelia.hilpert@ethereal.email');
    console.log('You can view sent emails at: https://ethereal.email/messages');
  }
});

// Email sending utility
const sendEmail = async (to, subject, html) => {
  if (!emailConfig.isEnabled || !emailConfig.transporter) {
    console.warn('Email not sent: Email service is not configured or enabled');
    return false;
  }

  try {
    await emailConfig.transporter.sendMail({
      from: `"Doctor Appointment System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return false;
  }
};

// API Routes
app.use('/api/video', videoRoutes);

// Auth Routes

// Doctor registration validation
const validateDoctorRegistration = (data) => {
  if (!data.specialization || data.specialization.trim() === '') {
    return 'Specialization is required for doctors';
  }
  if (!data.licenseNumber || data.licenseNumber.trim() === '') {
    return 'License number is required for doctors';
  }
  if (!data.yearsOfExperience || isNaN(parseInt(data.yearsOfExperience))) {
    return 'Valid years of experience is required for doctors';
  }
  return null;
};

// User Registration
// User Registration - FIXED VERSION
app.post('/api/auth/register', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      phone, 
      dateOfBirth, 
      gender, 
      role = 'patient',
      specialization,
      licenseNumber,
      yearsOfExperience
    } = req.body;

    // Basic validation
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Validate doctor registration
    if (role === 'doctor') {
      const validationError = validateDoctorRegistration({
        specialization,
        licenseNumber,
        yearsOfExperience
      });
      
      if (validationError) {
        return res.status(400).json({ message: validationError });
      }
    }

    // ❌ REMOVE THIS LINE - Don't hash manually
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Create base user object with PLAIN TEXT password
    const userData = {
      name,
      email,
      password, // ✅ Use plain text - let the model middleware handle hashing
      phone,
      dateOfBirth,
      gender,
      role,
      verified: role === 'patient',
      ...(role === 'doctor' && {
        specialization,
        licenseNumber,
        yearsOfExperience: parseInt(yearsOfExperience) || 0,
        isApproved: false
      })
    };

    // Store user - the pre-save middleware will hash the password
    const createdUser = await User.create(userData);

    // Generate JWT token
    const token = jwt.sign(
      { id: createdUser._id, email: createdUser.email, role: createdUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send appropriate welcome email based on role
    const emailSubject = role === 'doctor' 
      ? 'Doctor Registration Received - HealthCare+' 
      : 'Welcome to HealthCare+';
      
    let emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${role === 'doctor' ? 'Doctor Registration Received' : 'Welcome to HealthCare+'}</h2>
        <p>Dear ${name},</p>
    `;

    if (role === 'doctor') {
      emailContent += `
        <p>Thank you for registering as a doctor with HealthCare+.</p>
        <p>Your registration is under review by our admin team. You will receive a confirmation email once your account is approved.</p>
        <p><strong>Registration Details:</strong></p>
        <ul>
          <li>Specialization: ${specialization}</li>
          <li>License Number: ${licenseNumber}</li>
          <li>Years of Experience: ${yearsOfExperience}</li>
        </ul>
        <p>You will be able to:</p>
        <ul>
          <li>Manage your availability</li>
          <li>Receive and confirm appointments</li>
          <li>Conduct video consultations</li>
          <li>View your appointment history</li>
        </ul>
      `;
    } else {
      emailContent += `
        <p>Thank you for registering with HealthCare+. Your account has been created successfully.</p>
        <p>You can now:</p>
        <ul>
          <li>Browse and book appointments with certified doctors</li>
          <li>Schedule video consultations</li>
          <li>Access your medical records</li>
          <li>Receive appointment reminders</li>
        </ul>
      `;
    }

    emailContent += `
        <p>Best regards,<br>HealthCare+ Team</p>
      </div>
    `;

    // Send email
    const emailSent = await sendEmail(email, emailSubject, emailContent);

    // Return user data without password
    const userResponse = {
      _id: createdUser._id,
      name: createdUser.name,
      email: createdUser.email,
      phone: createdUser.phone,
      dateOfBirth: createdUser.dateOfBirth,
      gender: createdUser.gender,
      role: createdUser.role,
      verified: createdUser.verified,
      ...(role === 'doctor' && {
        specialization: createdUser.specialization,
        licenseNumber: createdUser.licenseNumber,
        yearsOfExperience: createdUser.yearsOfExperience,
        isApproved: createdUser.isApproved
      })
    };

    res.status(201).json({
      message: 'User registered successfully',
      user: userResponse,
      token,
      emailSent
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Server error during registration',
      details: error.message 
    });
  }
});

// Enhanced User Login with comprehensive debugging
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login request received:', { body: req.body });
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password'
      });
    }

    // Find user with password explicitly selected
    const user = await User.findOne({ email })
      .select('+password +role +isApproved')
      .lean();
      
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('No user found with email:', email);
      return res.status(400).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Check if doctor is approved
    if (user.role === 'doctor' && !user.isApproved) {
      console.log('Doctor not approved yet:', email);
      return res.status(403).json({
        success: false,
        error: 'Your account is pending admin approval. Please wait for approval before logging in.'
      });
    }

    // Check if password is provided and not undefined
    if (!user.password) {
      console.error('User found but password is undefined');
      console.log('User document:', user);
      return res.status(500).json({
        success: false,
        error: 'Internal server error: No password set for this account'
      });
    }

    // Enhanced password debugging
    console.log('=== PASSWORD DEBUGGING ===');
    console.log('Input password:', `'${password}'`);
    console.log('Input password length:', password.length);
    console.log('Input password type:', typeof password);
    console.log('Input password buffer:', Buffer.from(password));
    console.log('Stored hash:', user.password);
    console.log('Hash length:', user.password.length);
    console.log('Hash starts with $2a$, $2b$, or $2y$:', /^\$2[aby]\$/.test(user.password));
    
    // Check for invisible characters
    const hasInvisibleChars = /[\u0000-\u001f\u007f-\u009f]/.test(password);
    console.log('Password has invisible characters:', hasInvisibleChars);
    if (hasInvisibleChars) {
      console.log('Invisible characters detected in password');
    }
    
    try {
      // Test multiple password variants
      const passwordVariants = [
        password,                    // Original
        password.trim(),            // Trimmed
        password.replace(/\s+/g, ''), // Remove all whitespace
        password.normalize('NFC'),   // Unicode normalization
        password.replace(/[^\x20-\x7E]/g, '') // Remove non-printable ASCII
      ];
      
      console.log('Testing password variants:');
      let isMatch = false;
      let matchedVariant = null;
      
      for (let i = 0; i < passwordVariants.length; i++) {
        const variant = passwordVariants[i];
        console.log(`Variant ${i + 1}:`, `'${variant}' (length: ${variant.length})`);
        
        try {
          const result = await bcrypt.compare(variant, user.password);
          console.log(`Variant ${i + 1} result:`, result);
          
          if (result) {
            isMatch = true;
            matchedVariant = i + 1;
            console.log(`✓ Password matched with variant ${i + 1}`);
            break;
          }
        } catch (bcryptError) {
          console.error(`Error testing variant ${i + 1}:`, bcryptError.message);
        }
      }
      
      if (!isMatch) {
        console.log('❌ All password variants failed');
        
        // Additional debugging - test hash validity
        try {
          const testHash = await bcrypt.hash('test', 10);
          const testResult = await bcrypt.compare('test', testHash);
          console.log('Bcrypt functionality test (should be true):', testResult);
        } catch (testError) {
          console.error('Bcrypt functionality test failed:', testError);
        }
        
        // Check if this might be a hash format issue
        console.log('Investigating hash format...');
        console.log('Hash format analysis:', {
          startsWithDollar: user.password.startsWith('$'),
          containsDollarCount: (user.password.match(/\$/g) || []).length,
          segments: user.password.split('$')
        });
        
        return res.status(400).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
      
      console.log(`✅ Password verified successfully with variant ${matchedVariant}`);
      
    } catch (error) {
      console.error('Error during password comparison:', error);
      return res.status(500).json({
        success: false,
        error: 'Error during authentication',
        details: error.message
      });
    }

    // Generate JWT token
    console.log('Generating JWT token...');
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    // Remove password from response
    const { password: _, ...userResponse } = user;

    console.log('Login successful for user:', user.email);
    res.json({
      success: true,
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login',
      details: error.message
    });
  }
});

// Utility function to test password hashing (for debugging)
app.post('/api/debug/test-hash', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }
    
    console.log('Testing password hashing for:', password);
    const hash = await bcrypt.hash(password, 10);
    const isValid = await bcrypt.compare(password, hash);
    
    res.json({
      original: password,
      hash: hash,
      verification: isValid,
      hashLength: hash.length
    });
  } catch (error) {
    console.error('Hash test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Function to rehash a password (call this if needed)
const rehashUserPassword = async (email, plainPassword) => {
  try {
    const hash = await bcrypt.hash(plainPassword, 10);
    const result = await User.updateOne(
      { email: email },
      { password: hash }
    );
    console.log('Password rehashed for:', email);
    return result;
  } catch (error) {
    console.error('Rehash error:', error);
    throw error;
  }
};

// Get user profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Book appointment
app.post('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const {
      doctorId,
      date,
      time,
      type,
      symptoms,
      patientName,
      phone
    } = req.body;

    const appointment = {
      id: uuidv4(),
      patientId: req.user.id,
      doctorId,
      date,
      time,
      type,
      symptoms,
      patientName,
      phone,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };

    appointments.push(appointment);

    // Send confirmation email
    const user = users.find(u => u.id === req.user.id);
    if (user) {
      await sendEmail(
        user.email,
        'Appointment Confirmation - HealthCare+',
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Appointment Confirmed</h2>
          <p>Dear ${patientName},</p>
          <p>Your appointment has been successfully booked.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Appointment Details:</h3>
            <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${time}</p>
            <p><strong>Type:</strong> ${type === 'online' ? 'Video Consultation' : 'In-Person Visit'}</p>
            <p><strong>Doctor ID:</strong> ${doctorId}</p>
          </div>
          <p>We'll send you a reminder 24 hours before your appointment.</p>
          <p>Best regards,<br>HealthCare+ Team</p>
        </div>
        `
      );
    }

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment
    });
  } catch (error) {
    console.error('Appointment booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user appointments
app.get('/api/appointments', authenticateToken, (req, res) => {
  const userAppointments = appointments.filter(a => a.patientId === req.user.id);
  res.json(userAppointments);
});

// Video calling endpoints
app.post('/api/video/create-room', authenticateToken, (req, res) => {
  const roomId = uuidv4();
  videoSessions.set(roomId, {
    id: roomId,
    participants: [],
    createdAt: new Date().toISOString(),
    createdBy: req.user.id
  });

  res.json({ roomId });
});

app.get('/api/video/room/:roomId', authenticateToken, (req, res) => {
  const { roomId } = req.params;
  const session = videoSessions.get(roomId);
  
  if (!session) {
    return res.status(404).json({ message: 'Room not found' });
  }

  res.json(session);
});

// Socket.IO for video calling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId);

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });

  socket.on('offer', (roomId, offer) => {
    socket.to(roomId).emit('offer', offer);
  });

  socket.on('answer', (roomId, answer) => {
    socket.to(roomId).emit('answer', answer);
  });

  socket.on('ice-candidate', (roomId, candidate) => {
    socket.to(roomId).emit('ice-candidate', candidate);
  });

  socket.on('end-call', (roomId) => {
    socket.to(roomId).emit('call-ended');
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
server.listen(config.PORT, () => {
  console.log(`Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
  console.log(`CORS enabled for: ${config.CORS_ORIGIN}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});