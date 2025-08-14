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
// Layout wrapper component to include the Layout component for all routes except auth pages
const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthPage, setIsAuthPage] = React.useState(false);
  
  React.useEffect(() => {
    setIsAuthPage(['/login', '/register'].includes(window.location.pathname));
  }, []);
  
  return isAuthPage ? (
    <>{children}</>
  ) : (
    <Layout>
      {children}
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <LayoutWrapper>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/doctors/:id" element={<DoctorProfile />} />
            <Route path="/booking/:id" element={
              <ProtectedRoute>
                <AppointmentBooking />
              </ProtectedRoute>
            } />
            <Route path="/consultation" element={
              <ProtectedRoute>
                <Consultation />
              </ProtectedRoute>
            } />
            <Route path="/health-records" element={
              <ProtectedRoute allowedRoles={['patient']}>
                <HealthRecords />
              </ProtectedRoute>
            } />
            
            {/* Video Consultation Routes */}
            <Route path="/video-consultation" element={
              <ProtectedRoute>
                <VideoConsultation />
              </ProtectedRoute>
            } />
            
            <Route path="/video-call/:roomId" element={
              <ProtectedRoute>
                <VideoCallPage />
              </ProtectedRoute>
            } />
            
            {/* Testing Route */}
            <Route path="/webrtc-test" element={<WebRTCTest />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              {/* Profile */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              
              {/* Appointment Booking */}
              <Route path="/appointment/doctor/:doctorId" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <AppointmentBooking />
                </ProtectedRoute>
              } />
              
              {/* Patient Routes */}
              <Route path="/appointments" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <MyAppointments />
                </ProtectedRoute>
              } />
              <Route path="/my-appointments" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <Navigate to="/appointments" replace />
                </ProtectedRoute>
              } />
              
              <Route path="/patient/dashboard" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientDashboard />
                </ProtectedRoute>
              } />
              
              {/* Doctor Routes */}
              <Route path="/doctor/dashboard" element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              } />
              
              {/* Legacy Dashboard Route - Redirect based on role */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['patient', 'doctor']}>
                  <Navigate to="/patient/dashboard" replace />
                </ProtectedRoute>
              } />
            </Route>
            
            {/* Error Pages */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </LayoutWrapper>
      </AuthProvider>
    </Router>
  );
};

export default App;