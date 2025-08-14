import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, Clock, User, CheckCircle, Phone, Calendar, AlertCircle } from 'lucide-react';
import VideoCall from '../components/VideoConsultation/VideoCall';
import { videoAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const VideoConsultation: React.FC = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [callState, setCallState] = useState<'waiting' | 'connecting' | 'connected' | 'ended'>('waiting');
  const [roomId, setRoomId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Mock doctor data - in real app, fetch based on doctorId
  const doctor = {
    id: doctorId || '1',
    name: 'Dr. Sarah Johnson',
    specialty: 'Cardiologist',
    image: 'https://images.pexels.com/photos/5327921/pexels-photo-5327921.jpeg?auto=compress&cs=tinysrgb&w=400',
    experience: 15,
    rating: 4.9,
    consultationFee: 150
  };

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  const startCall = async () => {
    if (!user) {
      toast.error('Please login to start a video call');
      navigate('/login');
      return;
    }

    setLoading(true);
    setCallState('connecting');
    
    try {
      // Create video room
      const response = await videoAPI.createRoom();
      const newRoomId = response.data.roomId;
      setRoomId(newRoomId);
      
      // Simulate connection delay
      setTimeout(() => {
        setCallState('connected');
        setLoading(false);
        toast.success('Connected to video call!');
      }, 2000);
      
    } catch (error) {
      console.error('Failed to create room:', error);
      toast.error('Failed to start video call. Please try again.');
      setCallState('waiting');
      setLoading(false);
    }
  };

  const endCall = () => {
    setCallState('ended');
    toast.success('Call ended successfully');
  };

  const goBackHome = () => {
    navigate('/');
  };

  const scheduleCall = () => {
    navigate(`/booking/${doctorId}?type=video`);
  };

  if (callState === 'connected') {
    return (
      <VideoCall
        doctorName={doctor.name}
        doctorImage={doctor.image}
        onEndCall={endCall}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {callState === 'waiting' && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Video Consultation</h1>
                  <p className="text-blue-100">Connect with your doctor online</p>
                </div>
                <Video className="w-12 h-12 text-blue-200" />
              </div>
            </div>

            {/* Doctor Info */}
            <div className="p-8">
              <div className="flex items-start space-x-6 mb-8">
                <img
                  src={doctor.image}
                  alt={doctor.name}
                  className="w-24 h-24 rounded-full border-4 border-blue-100"
                />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{doctor.name}</h2>
                  <p className="text-blue-600 font-semibold mb-2">{doctor.specialty}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    <span>{doctor.experience} years experience</span>
                    <span>★ {doctor.rating} rating</span>
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    ${doctor.consultationFee} consultation fee
                  </div>
                </div>
              </div>

              {/* Call Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center mb-4">
                    <Video className="w-8 h-8 text-green-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">Instant Video Call</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Start an immediate video consultation with the doctor if available.
                  </p>
                  <button
                    onClick={startCall}
                    disabled={loading}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Connecting...' : 'Start Instant Call'}
                  </button>
                </div>

                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center mb-4">
                    <Calendar className="w-8 h-8 text-blue-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">Schedule Video Call</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Book a scheduled video consultation at a convenient time.
                  </p>
                  <button
                    onClick={scheduleCall}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Schedule Appointment
                  </button>
                </div>
              </div>

              {/* Pre-call Checklist */}
              <div className="bg-gray-50 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pre-consultation Checklist</h3>
                <div className="space-y-3">
                  {[
                    'Ensure stable internet connection',
                    'Test your camera and microphone',
                    'Find a quiet, well-lit environment',
                    'Have your medical records ready',
                    'Prepare list of current medications'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Check */}
              <div className="bg-blue-50 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Check</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="font-medium text-gray-900">Internet</p>
                    <p className="text-sm text-green-600">Good Connection</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="font-medium text-gray-900">Camera</p>
                    <p className="text-sm text-green-600">Working</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="font-medium text-gray-900">Microphone</p>
                    <p className="text-sm text-green-600">Working</p>
                  </div>
                </div>
              </div>

              {/* Emergency Notice */}
              <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                <div className="flex items-start">
                  <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-lg font-semibold text-red-800 mb-2">Emergency Notice</h4>
                    <p className="text-red-700 text-sm">
                      If you are experiencing a medical emergency, please call 911 or go to your nearest emergency room immediately. 
                      This video consultation service is not intended for emergency medical situations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {callState === 'connecting' && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connecting to {doctor.name}</h2>
            <p className="text-gray-600 mb-6">Please wait while we establish the connection...</p>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-4">
                <img
                  src={doctor.image}
                  alt={doctor.name}
                  className="w-16 h-16 rounded-full border-2 border-gray-200"
                />
                <div className="text-left">
                  <p className="font-semibold text-gray-900">{doctor.name}</p>
                  <p className="text-sm text-gray-600">{doctor.specialty}</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setCallState('waiting')}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {callState === 'ended' && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Consultation Completed</h2>
            <p className="text-gray-600 mb-8">
              Thank you for using our video consultation service. Your consultation summary 
              and prescription will be sent to your email shortly.
            </p>
            
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
              <div className="text-left space-y-2">
                <p className="text-gray-700">• Check your email for consultation summary</p>
                <p className="text-gray-700">• Download prescription if provided</p>
                <p className="text-gray-700">• Follow up as recommended by your doctor</p>
                <p className="text-gray-700">• Rate your consultation experience</p>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={goBackHome}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Return Home
              </button>
              <button 
                onClick={() => navigate('/doctors')}
                className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Book Another Consultation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoConsultation;