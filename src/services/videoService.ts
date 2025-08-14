import axios from 'axios';
import { getAuthHeader } from './auth';

const API_BASE_URL = 'http://localhost:3001/api/video';

interface VideoSession {
  sessionId: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  scheduledTime: string;
  duration: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  meetingDetails?: {
    meetingId: string;
    password: string;
    joinUrl: string;
  };
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  endedAt?: string;
}

interface ScheduleVideoCallParams {
  appointmentId: string;
  patientId: string;
  scheduledTime: string;
  duration: number;
}

export const videoService = {
  // Schedule a new video call (Doctor only)
  async scheduleCall(params: ScheduleVideoCallParams): Promise<VideoSession> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/schedule`,
        params,
        { headers: getAuthHeader() }
      );
      return response.data.session;
    } catch (error) {
      console.error('Error scheduling video call:', error);
      throw error;
    }
  },

  // Start a video call (Doctor only)
  async startCall(sessionId: string): Promise<{ meetingDetails: never }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/start`,
        { sessionId },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error starting video call:', error);
      throw error;
    }
  },

  // Get session details
  async getSession(sessionId: string): Promise<VideoSession> {
    try {
      const response = await axios.get(`${API_BASE_URL}/session/${sessionId}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching session details:', error);
      throw error;
    }
  },

  // Join a video call
  async joinCall(sessionId: string): Promise<{ 
    meetingDetails: unknown; 
    authToken: string;
  }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/join`,
        { sessionId },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error joining video call:', error);
      throw error;
    }
  },

  // End a video call (Doctor only)
  async endCall(sessionId: string): Promise<VideoSession> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/end`,
        { sessionId },
        { headers: getAuthHeader() }
      );
      return response.data.session;
    } catch (error) {
      console.error('Error ending video call:', error);
      throw error;
    }
  },

  // Get all video sessions for the current user
  async getMySessions(): Promise<VideoSession[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/my-sessions`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      throw error;
    }
  },

  // Helper function to format time remaining until the call starts
  getTimeUntilCall(scheduledTime: string): string {
    const now = new Date();
    const callTime = new Date(scheduledTime);
    const diffMs = callTime.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Call should start now';
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) {
      return `Starts in ${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'}`;
    }
    
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    
    if (diffHours < 24) {
      return `Starts in ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'}${
        remainingMins > 0 ? ` and ${remainingMins} ${remainingMins === 1 ? 'minute' : 'minutes'}` : ''
      }`;
    }
    
    const diffDays = Math.floor(diffHours / 24);
    return `Starts in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
  },

  // Helper function to check if a call can be joined
  canJoinCall(session: VideoSession): boolean {
    if (session.status !== 'in-progress') return false;
    
    const now = new Date();
    const scheduledTime = new Date(session.scheduledTime);
    const endTime = new Date(session.startedAt || scheduledTime);
    endTime.setMinutes(endTime.getMinutes() + (session.duration || 60));
    
    return now >= scheduledTime && now <= endTime;
  }
};

export default videoService;
