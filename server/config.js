import 'dotenv/config';

const config = {
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'arslan',
  JWT_EXPIRES_IN: '24h',
  
  // Server Configuration
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // Email Configuration
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'gmail',
  EMAIL_USER: process.env.EMAIL_USER || 'your-email@gmail.com',
  EMAIL_PASS: process.env.EMAIL_PASS || 'your-app-password',
  
  // File Upload Configuration
  UPLOAD_DIR: 'uploads',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  
  // Video Call Configuration
  VIDEO_CALL_DURATION: 60, // Default duration in minutes
  VIDEO_CALL_BUFFER_TIME: 15, // Buffer time between calls in minutes
  
  // Database Configuration (if using a database in the future)
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 27017,
  DB_NAME: process.env.DB_NAME || 'doctor_appointment',
  DB_USER: process.env.DB_USER || '',
  DB_PASS: process.env.DB_PASS || ''
};

export default config;
