import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { videoService } from '../services/videoService';
import VideoCall from '../components/VideoCall';
import { toast } from 'react-hot-toast';

const VideoCallPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDoctor, setIsDoctor] = useState(false);

  // Check if the current user is the doctor for this session
  useEffect(() => {
    if (!isAuthenticated || !sessionId) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    const loadSession = async () => {
      try {
        const sessionData = await videoService.getSession(sessionId);
        setSession(sessionData);
        
        // Check if the current user is the doctor for this session
        const userIsDoctor = sessionData.doctorId === user?.id;
        setIsDoctor(userIsDoctor);
        
        // If the user is not part of this session, redirect to dashboard
        if (sessionData.doctorId !== user?.id && sessionData.patientId !== user?.id) {
          toast.error('You are not authorized to join this call');
          navigate(user?.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
          return;
        }
        
        // If the session is not in progress and the user is a patient, check if they can join
        if (sessionData.status !== 'in-progress' && !userIsDoctor) {
          const canJoin = videoService.canJoinCall(sessionData);
          if (!canJoin) {
            toast.error('This call has not started yet or has already ended');
            navigate('/patient/dashboard');
          }
        }
        
      } catch (err) {
        console.error('Error loading session:', err);
        setError('Failed to load video session. It may have expired or been cancelled.');
        toast.error('Failed to load video session');
        navigate(user?.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
      }
    };
    
    loadSession();
  }, [sessionId, user, isAuthenticated, navigate]);

  // Handle call end
  const handleCallEnd = () => {
    toast.success('Call ended successfully');
    navigate(isDoctor ? '/doctor/dashboard' : '/patient/dashboard');
  };

  if (loading || !session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg">Preparing your video call...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(isDoctor ? '/doctor/dashboard' : '/patient/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900">
      <VideoCall 
        isDoctor={isDoctor} 
        onEndCall={handleCallEnd} 
      />
      
      {/* Call controls and info overlay could go here */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm">
        Meeting ID: {sessionId?.substring(0, 8)} • {isDoctor ? 'You are the doctor' : 'You are the patient'}
      </div>
    </div>
  );
};

export default VideoCallPage;
