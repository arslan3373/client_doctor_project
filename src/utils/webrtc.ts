import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

type PeerConnection = RTCPeerConnection & { id: string };

export class WebRTCSignaling {
  private socket: Socket;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private configuration: RTCConfiguration;
  private onRemoteStream: (stream: MediaStream) => void;
  private onCallEnd: () => void;
  private peerId: string;

  constructor(
    roomId: string,
    isInitiator: boolean,
    onRemoteStream: (stream: MediaStream) => void,
    onCallEnd: () => void,
    configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        // Add TURN servers here for production
      ]
    }
  ) {
    this.peerId = uuidv4();
    this.onRemoteStream = onRemoteStream;
    this.onCallEnd = onCallEnd;
    this.configuration = configuration;

    // Connect to signaling server
    this.socket = io('http://localhost:3001', {
      query: { roomId, peerId: this.peerId, isInitiator }
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to signaling server');
    });

    this.socket.on('offer', async (offer: RTCSessionDescriptionInit) => {
      console.log('Received offer');
      if (!this.peerConnection) {
        await this.createPeerConnection();
      }
      
      try {
        await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection?.createAnswer();
        await this.peerConnection?.setLocalDescription(answer);
        this.socket.emit('answer', answer);
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    this.socket.on('answer', async (answer: RTCSessionDescriptionInit) => {
      console.log('Received answer');
      try {
        if (!this.peerConnection) {
          console.error('No peer connection');
          return;
        }
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    });

    this.socket.on('ice-candidate', async (candidate: RTCIceCandidate) => {
      console.log('Received ICE candidate');
      try {
        if (this.peerConnection) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });

    this.socket.on('end-call', () => {
      console.log('Call ended by remote peer');
      this.cleanup();
      this.onCallEnd();
    });

    this.socket.on('error', (error: Error) => {
      console.error('Signaling error:', error);
    });
  }

  async createPeerConnection() {
    this.peerConnection = new RTCPeerConnection(this.configuration) as PeerConnection;
    this.peerConnection.id = this.peerId;

    // Add local stream tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection) {
          this.peerConnection.addTrack(track, this.localStream!);
        }
      });
    }

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        this.onRemoteStream(this.remoteStream);
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', event.candidate);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
      
      if (this.peerConnection?.connectionState === 'disconnected' || 
          this.peerConnection?.connectionState === 'failed') {
        this.cleanup();
        this.onCallEnd();
      }
    };
  }

  async startCall(localStream: MediaStream) {
    this.localStream = localStream;
    
    if (!this.peerConnection) {
      await this.createPeerConnection();
    }

    try {
      const offer = await this.peerConnection?.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await this.peerConnection?.setLocalDescription(offer);
      this.socket.emit('offer', offer);
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  async setLocalStream(stream: MediaStream) {
    this.localStream = stream;
    
    // If peer connection exists, replace tracks
    if (this.peerConnection) {
      const senders = this.peerConnection.getSenders();
      
      // Remove existing tracks
      for (const sender of senders) {
        this.peerConnection.removeTrack(sender);
      }
      
      // Add new tracks
      stream.getTracks().forEach(track => {
        if (this.peerConnection) {
          this.peerConnection.addTrack(track, stream);
        }
      });
    }
  }

  endCall() {
    this.socket.emit('end-call');
    this.cleanup();
  }

  private cleanup() {
    // Stop all media tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  // Toggle audio track
  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  // Toggle video track
  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }
}

export const getMediaDevices = async (): Promise<MediaDeviceInfo[]> => {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices;
  } catch (error) {
    console.error('Error getting media devices:', error);
    throw error;
  }
};

export const getLocalStream = async (constraints: MediaStreamConstraints = {
  audio: true,
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 }
  }
}): Promise<MediaStream> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (error) {
    console.error('Error getting local stream:', error);
    throw error;
  }
};
