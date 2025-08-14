import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import config from './config.js';

const router = express.Router();

// In-memory storage for video sessions (replace with database in production)
const videoSessions = new Map();

// Logging middleware
const logger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
};

router.use(logger);

// Middleware to verify JWT token and check if user is a doctor
const authenticateDoctor = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, config.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    
    if (user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can perform this action' });
    }
    
    req.user = user;
    next();
  });
};

// Middleware to verify JWT token for any authenticated user
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, config.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  });
};

// Schedule a new video call (Doctor only)
router.post('/schedule', authenticateDoctor, (req, res) => {
  try {
    const { appointmentId, scheduledTime, patientId, duration } = req.body;
    const doctorId = req.user.userId;
    
    if (!appointmentId || !scheduledTime || !patientId || !duration) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const sessionId = uuidv4();
    const sessionData = {
      sessionId,
      appointmentId,
      doctorId,
      patientId,
      scheduledTime: new Date(scheduledTime),
      duration: parseInt(duration), // in minutes
      status: 'scheduled', // scheduled, in-progress, completed, cancelled
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    videoSessions.set(sessionId, sessionData);
    
    // In a real app, you would also update the appointment status in the database
    
    res.status(201).json({
      message: 'Video call scheduled successfully',
      session: sessionData
    });
    
  } catch (error) {
    console.error('Error scheduling video call:', error);
    res.status(500).json({ message: 'Failed to schedule video call' });
  }
});

// Start a video call (Doctor only)
router.post('/start', authenticateDoctor, (req, res) => {
  try {
    const { sessionId } = req.body;
    const doctorId = req.user.userId;
    
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }
    
    const session = videoSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    if (session.doctorId !== doctorId) {
      return res.status(403).json({ message: 'You are not authorized to start this session' });
    }
    
    if (session.status !== 'scheduled') {
      return res.status(400).json({ message: 'Session is not in a startable state' });
    }
    
    // Update session status and generate meeting details
    session.status = 'in-progress';
    session.startedAt = new Date();
    session.updatedAt = new Date();
    
    // In a real app, you would generate meeting credentials for a video service like Zoom
    const meetingDetails = {
      meetingId: uuidv4(),
      password: Math.random().toString(36).substring(2, 8),
      joinUrl: `https://your-video-service.com/join/${sessionId}`
    };
    
    session.meetingDetails = meetingDetails;
    
    res.status(200).json({
      message: 'Video call started successfully',
      meetingDetails
    });
    
  } catch (error) {
    console.error('Error starting video call:', error);
    res.status(500).json({ message: 'Failed to start video call' });
  }
});

// Get session details (for both doctor and patient)
router.get('/session/:sessionId', authenticateUser, (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;
    
    const session = videoSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    // Only allow the doctor or patient associated with the session to view it
    if (session.doctorId !== userId && session.patientId !== userId) {
      return res.status(403).json({ message: 'You are not authorized to view this session' });
    }
    
    res.status(200).json(session);
    
  } catch (error) {
    console.error('Error fetching session details:', error);
    res.status(500).json({ message: 'Failed to fetch session details' });
  }
});

// Join a video call (for both doctor and patient)
router.post('/join', authenticateUser, (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user.userId;
    
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }
    
    const session = videoSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    // Only allow the doctor or patient associated with the session to join
    if (session.doctorId !== userId && session.patientId !== userId) {
      return res.status(403).json({ message: 'You are not authorized to join this session' });
    }
    
    if (session.status !== 'in-progress') {
      return res.status(400).json({ 
        message: 'Session is not active', 
        status: session.status 
      });
    }
    
    // In a real app, you would generate a token for the video service
    const authToken = jwt.sign(
      { 
        userId,
        sessionId,
        role: session.doctorId === userId ? 'doctor' : 'patient',
        userType: session.doctorId === userId ? 'doctor' : 'patient'
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN || '1h' }
    );
    
    res.status(200).json({
      message: 'Join successful',
      meetingDetails: session.meetingDetails,
      authToken
    });
    
  } catch (error) {
    console.error('Error joining video call:', error);
    res.status(500).json({ message: 'Failed to join video call' });
  }
});

// End a video call (Doctor only)
router.post('/end', authenticateDoctor, (req, res) => {
  try {
    const { sessionId } = req.body;
    const doctorId = req.user.userId;
    
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }
    
    const session = videoSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    if (session.doctorId !== doctorId) {
      return res.status(403).json({ message: 'You are not authorized to end this session' });
    }
    
    if (session.status !== 'in-progress') {
      return res.status(400).json({ message: 'Session is not in progress' });
    }
    
    // Update session status
    session.status = 'completed';
    session.endedAt = new Date();
    session.updatedAt = new Date();
    
    // In a real app, you would also update the appointment status in the database
    
    res.status(200).json({
      message: 'Video call ended successfully',
      session
    });
    
  } catch (error) {
    console.error('Error ending video call:', error);
    res.status(500).json({ message: 'Failed to end video call' });
  }
});

// Get all video sessions for a user (both doctor and patient)
router.get('/my-sessions', authenticateUser, (req, res) => {
  try {
    const userId = req.user.userId;
    const userSessions = [];
    
    // In a real app, you would query the database with proper filtering
    for (const [sessionId, session] of videoSessions.entries()) {
      if (session.doctorId === userId || session.patientId === userId) {
        userSessions.push({
          sessionId,
          ...session
        });
      }
    }
    
    res.status(200).json(userSessions);
    
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    res.status(500).json({ message: 'Failed to fetch user sessions' });
  }
});

export default router;