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
const JWT_SECRET = process.env.JWT_SECRET || "arslan";

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

// Email configuration for development using Ethereal
const emailConfig = {
  isEnabled: true,
  transporter: nodemailer.createTransporter({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
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
    const info = await emailConfig.transporter.sendMail({
      from: `"HealthCare+ System" <noreply@healthcareplus.com>`,
      to,
      subject,
      html
    });
    console.log(`Email sent to ${to}. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return false;
  }
};

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: config.MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// API Routes
app.use('/api/video', videoRoutes);

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
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Validate doctor registration
    if (role === 'doctor') {
      const validationError = validateDoctorRegistration({
        specialization,
        licenseNumber,
        yearsOfExperience
      });
      
      if (validationError) {
        return res.status(400).json({ 
          success: false, 
          message: validationError 
        });
      }
    }

    // Create user data
    const userData = {
      name,
      email,
      password, // Will be hashed by the model middleware
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

    // Create user
    const createdUser = await User.create(userData);

    // Generate JWT token
    const token = jwt.sign(
      { id: createdUser._id, email: createdUser.email, role: createdUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send welcome email
    const emailSubject = role === 'doctor' 
      ? 'Doctor Registration Received - HealthCare+' 
      : 'Welcome to HealthCare+';
      
    let emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">HealthCare+</h1>
          <h2 style="color: #374151;">${role === 'doctor' ? 'Doctor Registration Received' : 'Welcome to HealthCare+'}</h2>
        </div>
        
        <p style="color: #374151; font-size: 16px;">Dear ${name},</p>
    `;

    if (role === 'doctor') {
      emailContent += `
        <p style="color: #374151; line-height: 1.6;">Thank you for registering as a doctor with HealthCare+.</p>
        <p style="color: #374151; line-height: 1.6;">Your registration is under review by our admin team. You will receive a confirmation email once your account is approved.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">Registration Details:</h3>
          <ul style="color: #374151; line-height: 1.6;">
            <li><strong>Specialization:</strong> ${specialization}</li>
            <li><strong>License Number:</strong> ${licenseNumber}</li>
            <li><strong>Years of Experience:</strong> ${yearsOfExperience}</li>
          </ul>
        </div>
        
        <p style="color: #374151; line-height: 1.6;">Once approved, you will be able to:</p>
        <ul style="color: #374151; line-height: 1.6;">
          <li>Manage your availability and schedule</li>
          <li>Receive and confirm patient appointments</li>
          <li>Conduct video consultations</li>
          <li>Access patient medical records</li>
          <li>View your appointment history and earnings</li>
        </ul>
      `;
    } else {
      emailContent += `
        <p style="color: #374151; line-height: 1.6;">Thank you for registering with HealthCare+. Your account has been created successfully and is ready to use.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">You can now:</h3>
          <ul style="color: #374151; line-height: 1.6;">
            <li>Browse and book appointments with certified doctors</li>
            <li>Schedule video consultations from home</li>
            <li>Access and manage your medical records</li>
            <li>Receive appointment reminders and notifications</li>
            <li>Track your health history and prescriptions</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${config.CORS_ORIGIN}/doctors" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Find Doctors</a>
        </div>
      `;
    }

    emailContent += `
        <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            If you have any questions or need assistance, please don't hesitate to contact our support team.
          </p>
          <p style="color: #374151; margin-bottom: 0;">
            Best regards,<br>
            <strong>The HealthCare+ Team</strong>
          </p>
        </div>
      </div>
    `;

    // Send email
    const emailSent = await sendEmail(email, emailSubject, emailContent);

    // Return user data without password
    const userResponse = {
      id: createdUser._id,
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
      success: true,
      message: 'User registered successfully',
      user: userResponse,
      token,
      emailSent
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error during registration',
      details: error.message 
    });
  }
});

// Enhanced User Login
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
    const user = await User.findOne({ email }).select('+password');
      
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

    // Verify password using the model method
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      console.log('Password verification failed');
      return res.status(400).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    console.log('✅ Password verified successfully');

    // Generate JWT token
    console.log('Generating JWT token...');
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      role: user.role,
      verified: user.verified,
      ...(user.role === 'doctor' && {
        specialization: user.specialization,
        licenseNumber: user.licenseNumber,
        yearsOfExperience: user.yearsOfExperience,
        isApproved: user.isApproved
      })
    };

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

// Get user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Update user profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // Don't allow password updates through this endpoint
    delete updates.email; // Don't allow email updates
    delete updates.role; // Don't allow role updates

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Appointments endpoints
app.post('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const {
      doctorId,
      date,
      time,
      type,
      symptoms,
      patientName,
      phone,
      isVideoRequest
    } = req.body;

    // Create appointment data
    const appointmentData = {
      id: uuidv4(),
      patientId: req.user.id,
      doctorId,
      patientName,
      date,
      time,
      type: isVideoRequest ? 'online' : type,
      status: isVideoRequest ? 'pending' : 'scheduled',
      symptoms,
      phone,
      isVideoRequest: !!isVideoRequest,
      createdAt: new Date().toISOString()
    };

    // For demo purposes, we'll store in memory
    // In production, save to database
    console.log('Appointment created:', appointmentData);

    // Send confirmation email
    const user = await User.findById(req.user.id);
    if (user && emailConfig.isEnabled) {
      const emailSubject = isVideoRequest 
        ? 'Video Consultation Request Received - HealthCare+'
        : 'Appointment Confirmation - HealthCare+';
        
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">HealthCare+</h1>
            <h2 style="color: #374151;">${isVideoRequest ? 'Video Consultation Request' : 'Appointment Confirmed'}</h2>
          </div>
          
          <p style="color: #374151; font-size: 16px;">Dear ${patientName},</p>
          
          ${isVideoRequest ? `
            <p style="color: #374151; line-height: 1.6;">Your video consultation request has been received and is being reviewed by the doctor.</p>
            <p style="color: #374151; line-height: 1.6;">You will receive a confirmation with the scheduled time once the doctor reviews your request.</p>
          ` : `
            <p style="color: #374151; line-height: 1.6;">Your appointment has been successfully booked.</p>
          `}
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Appointment Details:</h3>
            <ul style="color: #374151; line-height: 1.6;">
              <li><strong>Date:</strong> ${isVideoRequest ? 'To be scheduled' : new Date(date).toLocaleDateString()}</li>
              <li><strong>Time:</strong> ${isVideoRequest ? 'To be scheduled' : time}</li>
              <li><strong>Type:</strong> ${isVideoRequest ? 'Video Consultation (Requested)' : type === 'online' ? 'Video Consultation' : 'In-Person Visit'}</li>
              <li><strong>Doctor ID:</strong> ${doctorId}</li>
              ${symptoms ? `<li><strong>Symptoms:</strong> ${symptoms}</li>` : ''}
            </ul>
          </div>
          
          <p style="color: #374151; line-height: 1.6;">
            ${isVideoRequest 
              ? 'We will notify you once the doctor confirms your video consultation time.'
              : 'We\'ll send you a reminder 24 hours before your appointment.'
            }
          </p>
          
          <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
            <p style="color: #374151; margin-bottom: 0;">
              Best regards,<br>
              <strong>The HealthCare+ Team</strong>
            </p>
          </div>
        </div>
      `;

      await sendEmail(user.email, emailSubject, emailContent);
    }

    res.status(201).json({
      success: true,
      message: isVideoRequest 
        ? 'Video consultation request submitted successfully'
        : 'Appointment booked successfully',
      data: appointmentData
    });
  } catch (error) {
    console.error('Appointment booking error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get user appointments
app.get('/api/appointments', authenticateToken, (req, res) => {
  // Mock appointments data for demo
  const mockAppointments = [
    {
      id: '1',
      doctorName: 'Dr. Sarah Johnson',
      specialty: 'Cardiologist',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: '10:00 AM',
      type: 'online',
      status: 'scheduled',
      symptoms: 'Chest pain and shortness of breath'
    },
    {
      id: '2',
      doctorName: 'Dr. Michael Chen',
      specialty: 'Dermatologist',
      date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
      time: '2:30 PM',
      type: 'in-person',
      status: 'scheduled',
      symptoms: 'Skin rash on arms'
    }
  ];

  res.json({
    success: true,
    data: mockAppointments
  });
});

// Get upcoming appointments
app.get('/api/appointments/upcoming', authenticateToken, (req, res) => {
  // Mock upcoming appointments
  const upcomingAppointments = [
    {
      id: '1',
      doctorName: 'Dr. Sarah Johnson',
      specialization: 'Cardiologist',
      date: new Date(Date.now() + 86400000).toISOString(),
      time: '10:00 AM',
      type: 'video',
      status: 'scheduled'
    }
  ];

  res.json({
    success: true,
    data: upcomingAppointments
  });
});

// Cancel appointment
app.patch('/api/appointments/:id/cancel', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  // Mock cancellation
  console.log(`Appointment ${id} cancelled by user ${req.user.id}`);
  
  res.json({
    success: true,
    message: 'Appointment cancelled successfully'
  });
});

// Doctor stats endpoint
app.get('/api/doctors/stats', authenticateToken, (req, res) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Doctor role required.'
    });
  }

  // Mock doctor stats
  const stats = {
    todayAppointments: 5,
    totalPatients: 127,
    monthlyEarnings: 8500,
    averageRating: 4.8,
    pendingAppointments: 3,
    completedAppointments: 89
  };

  res.json({
    success: true,
    data: stats
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'HealthCare+ API'
  });
});

// Start server
server.listen(config.PORT, () => {
  console.log(`🚀 Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
  console.log(`🌐 CORS enabled for: ${config.CORS_ORIGIN}`);
  console.log(`📧 Email service: ${emailConfig.isEnabled ? 'Enabled (Ethereal)' : 'Disabled'}`);
  console.log(`📁 Upload directory: ${config.UPLOAD_DIR}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  server.close(() => process.exit(1));
});