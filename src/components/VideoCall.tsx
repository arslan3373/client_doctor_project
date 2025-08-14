import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { videoService } from '../services/videoService';
import { toast } from 'react-hot-toast';
import { WebRTCSignaling, getLocalStream } from '../utils/webrtc';

interface VideoCallProps {
  isDoctor: boolean;
  onEndCall?: () => void;
}

const VideoCall: React.FC<VideoCallProps> = ({ isDoctor, onEndCall }) => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcRef = useRef<WebRTCSignaling | null>(null);
  
  // Initialize the video call
  const initializeCall = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get session details
      const sessionData = await videoService.getSession(sessionId!);
      setSession(sessionData);
      
      // Initialize WebRTC signaling
      webrtcRef.current = new WebRTCSignaling(
        sessionId!,
        isDoctor,
        (stream) => {
          setRemoteStream(stream);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }
        },
        () => {
          toast('Call ended', { icon: '👋' });
          if (onEndCall) onEndCall();
        }
      );
      
      // Start local media stream
      try {
        const stream = await getLocalStream();
        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // If doctor, start the call, otherwise wait for offer
        if (isDoctor) {
          await videoService.startCall(sessionId!);
          await webrtcRef.current.startCall(stream);
          setIsCallActive(true);
        } else {
          await videoService.joinCall(sessionId!);
          // The call will be activated when we receive the offer
        }
        
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setError('Could not access camera or microphone. Please check your permissions.');
        toast.error('Could not access camera or microphone');
      }
      
    } catch (err) {
      console.error('Error initializing video call:', err);
      setError('Failed to initialize video call. Please try again.');
      toast.error('Failed to initialize video call');
    } finally {
      setLoading(false);
    }
  }, [sessionId, isDoctor, onEndCall]);
  
  // Initialize call on mount
  useEffect(() => {
    initializeCall();
    
    // Cleanup on unmount
    return () => {
      if (webrtcRef.current) {
        webrtcRef.current.endCall();
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [initializeCall, localStream]);
  
  // Toggle mute/unmute
  const toggleMute = useCallback(() => {
    if (webrtcRef.current) {
      webrtcRef.current.toggleAudio(isMuted);
      setIsMuted(!isMuted);
      toast(isMuted ? 'Unmuted' : 'Muted', { 
        icon: isMuted ? '🔊' : '🔇' 
      });
    }
  }, [isMuted]);
  
  // Toggle video on/off
  const toggleVideo = useCallback(() => {
    if (webrtcRef.current) {
      webrtcRef.current.toggleVideo(isVideoOff);
      setIsVideoOff(!isVideoOff);
      toast(isVideoOff ? 'Video on' : 'Video off', { 
        icon: isVideoOff ? '📹' : '📷' 
      });
    }
  }, [isVideoOff]);
  
  // End the call
  const endCall = useCallback(async () => {
    try {
      if (webrtcRef.current) {
        webrtcRef.current.endCall();
      }
      
      if (isDoctor) {
        await videoService.endCall(sessionId!);
      }
      
      // Notify parent component
      if (onEndCall) {
        onEndCall();
      }
      
      // Navigate back to dashboard
      navigate(isDoctor ? '/doctor/dashboard' : '/patient/dashboard');
      
    } catch (err) {
      console.error('Error ending call:', err);
      toast.error('Failed to end call properly');
    }
  }, [isDoctor, navigate, onEndCall, sessionId]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg">Connecting to video call...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Main video area */}
      <div className="flex-1 relative">
        {/* Remote video */}
        <div className="absolute inset-0 bg-black">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">👤</span>
                </div>
                <p className="text-xl">Waiting for {isDoctor ? 'patient' : 'doctor'} to join...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Local video preview */}
        {localStream && (
          <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden bg-gray-800 shadow-lg border-2 border-white">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {/* Call info */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
          <h2 className="text-xl font-semibold">
            {isDoctor ? 'Patient: ' : 'Dr. '}
            {isDoctor ? session?.patientName : session?.doctorName}
          </h2>
          <p className="text-sm text-gray-300">
            {session?.status === 'in-progress' ? 'In Progress' : 'Connecting...'}
          </p>
        </div>
      </div>
      
      {/* Call controls */}
      <div className="bg-gray-800 py-4 px-6 flex justify-center space-x-8">
        <button
          onClick={toggleMute}
          className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-700'} hover:bg-opacity-80 transition-colors`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🎤'}
        </button>
        
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-700'} hover:bg-opacity-80 transition-colors`}
          title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoOff ? '📷' : '📹'}
        </button>
        
        <button
          onClick={endCall}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
          title="End call"
        >
          📞
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
