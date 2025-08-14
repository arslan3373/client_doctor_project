import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Doctors from './pages/Doctors';
import Login from './pages/Login';
import Register from './pages/Register';
import VideoConsultation from './pages/VideoConsultation';
import VideoCallPage from './pages/VideoCallPage';
import WebRTCTest from './pages/WebRTCTest';
import DoctorProfile from './pages/DoctorProfile';
import AppointmentBooking from './pages/AppointmentBooking';
import MyAppointments from './pages/MyAppointments';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import Consultation from './pages/Consultation';
import HealthRecords from './pages/HealthRecords';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/doctors" element={<Layout><Doctors /></Layout>} />
          <Route path="/doctors/:id" element={<Layout><DoctorProfile /></Layout>} />
          
          {/* Auth Routes - No Layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes with Layout */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout><Profile /></Layout>
            </ProtectedRoute>
          } />
          
          {/* Appointment Routes */}
          <Route path="/booking/:doctorId" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <Layout><AppointmentBooking /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/appointments" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <Layout><MyAppointments /></Layout>
            </ProtectedRoute>
          } />
          
          {/* Video Consultation Routes */}
          <Route path="/consultation" element={
            <ProtectedRoute>
              <Layout><Consultation /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/video-consultation" element={
            <ProtectedRoute>
              <Layout><VideoConsultation /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/video-consultation/:doctorId" element={
            <ProtectedRoute>
              <VideoConsultation />
            </ProtectedRoute>
          } />
          
          <Route path="/video-call/:roomId" element={
            <ProtectedRoute>
              <VideoCallPage />
            </ProtectedRoute>
          } />
          
          {/* Health Records */}
          <Route path="/health-records" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <Layout><HealthRecords /></Layout>
            </ProtectedRoute>
          } />
          
          {/* Dashboard Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          } />
          
          <Route path="/patient/dashboard" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <Layout><PatientDashboard /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/doctor/dashboard" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <Layout><DoctorDashboard /></Layout>
            </ProtectedRoute>
          } />
          
          {/* Testing Route */}
          <Route path="/webrtc-test" element={<Layout><WebRTCTest /></Layout>} />
          
          {/* Error Pages */}
          <Route path="/unauthorized" element={<Layout><Unauthorized /></Layout>} />
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

// Dashboard redirect component
const DashboardRedirect: React.FC = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (user.role === 'doctor') {
    return <Navigate to="/doctor/dashboard" replace />;
  } else {
    return <Navigate to="/patient/dashboard" replace />;
  }
};

export default App;