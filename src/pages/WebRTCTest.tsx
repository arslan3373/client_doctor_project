import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WebRTCSignaling, getLocalStream } from '../utils/webrtc';

const WebRTCTest: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [isInitiator, setIsInitiator] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [status, setStatus] = useState('Disconnected');
  const [peers, setPeers] = useState<string[]>([]);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcRef = useRef<WebRTCSignaling | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();

  // Initialize local stream
  useEffect(() => {
    const initLocalStream = async () => {
      try {
        const stream = await getLocalStream();
        localStreamRef.current = stream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
        setStatus('Error accessing camera/microphone');
      }
    };

    initLocalStream();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (webrtcRef.current) {
        webrtcRef.current.endCall();
      }
    };
  }, []);

  const connectToRoom = () => {
    if (!roomId.trim()) {
      alert('Please enter a room ID');
      return;
    }

    if (!localStreamRef.current) {
      alert('Failed to access camera/microphone');
      return;
    }

    setStatus('Connecting to room...');
    setIsConnected(true);

    // Initialize WebRTC signaling
    webrtcRef.current = new WebRTCSignaling(
      roomId,
      isInitiator,
      (stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          setIsCallActive(true);
          setStatus('Call connected');
        }
      },
      () => {
        setStatus('Call ended');
        setIsCallActive(false);
      }
    );

    // Start the call if initiator
    if (isInitiator) {
      setStatus('Starting call...');
      webrtcRef.current.startCall(localStreamRef.current)
        .then(() => {
          setStatus('Call started - waiting for peer...');
        })
        .catch(error => {
          console.error('Error starting call:', error);
          setStatus('Failed to start call');
        });
    } else {
      setStatus('Waiting for call...');
    }
  };

  const endCall = () => {
    if (webrtcRef.current) {
      webrtcRef.current.endCall();
      setIsCallActive(false);
      setIsConnected(false);
      setStatus('Call ended');
    }
  };

  const toggleInitiator = () => {
    if (isConnected) {
      alert('Cannot change role while in a call');
      return;
    }
    setIsInitiator(!isInitiator);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">WebRTC Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room ID
            </label>
            <div className="flex">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                placeholder="Enter room ID"
                disabled={isConnected}
              />
              <button
                onClick={toggleInitiator}
                className={`px-4 py-2 rounded-r-md text-sm font-medium ${
                  isInitiator
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                disabled={isConnected}
              >
                {isInitiator ? 'Initiator' : 'Joiner'}
              </button>
            </div>
          </div>

          <div className="flex space-x-4">
            {!isConnected ? (
              <button
                onClick={connectToRoom}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                disabled={!roomId.trim()}
              >
                {isInitiator ? 'Start Call' : 'Join Call'}
              </button>
            ) : (
              <button
                onClick={endCall}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                End Call
              </button>
            )}
          </div>

          <div className="mt-4 p-3 bg-gray-100 rounded-md">
            <p className="text-sm font-medium">Status: {status}</p>
            {peers.length > 0 && (
              <p className="text-sm mt-1">Peers: {peers.join(', ')}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black rounded-lg overflow-hidden">
            <h3 className="bg-gray-800 text-white p-2 text-sm font-medium">
              Local Video
            </h3>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 object-cover"
            />
          </div>

          <div className="bg-black rounded-lg overflow-hidden">
            <h3 className="bg-gray-800 text-white p-2 text-sm font-medium">
              Remote Video
            </h3>
            {isCallActive ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-64 object-cover"
              />
            ) : (
              <div className="w-full h-64 bg-gray-900 flex items-center justify-center">
                <p className="text-gray-400">Waiting for connection...</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700">
            <li>Enter a room ID (both participants must use the same ID)</li>
            <li>
              One person should be the <strong>Initiator</strong> (starts the call) and the other
              should be the <strong>Joiner</strong> (joins the call)
            </li>
            <li>Click "Start Call" (Initiator) or "Join Call" (Joiner)</li>
            <li>Allow camera and microphone access when prompted</li>
            <li>Once connected, you should see and hear each other</li>
            <li>Click "End Call" when finished</li>
          </ol>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> For testing, open this page in two different browser windows
                or on different devices. Make sure to set one as the Initiator and one as the Joiner.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebRTCTest;
