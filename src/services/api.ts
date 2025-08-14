import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  specialization?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  isApproved?: boolean;
  bio?: string;
  verified?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  role?: 'patient' | 'doctor';
  specialization?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
}

export interface AppointmentData {
  id?: string;
  doctorId: string;
  doctorName?: string;
  patientId?: string;
  patientName: string;
  date: string;
  time: string;
  type: 'in-person' | 'video' | 'video-request';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  symptoms?: string;
  reason?: string;
  notes?: string;
  phone: string;
  specialization?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DoctorStats {
  todayAppointments: number;
  totalPatients: number;
  monthlyEarnings: number;
  averageRating: number;
  pendingAppointments: number;
  completedAppointments: number;
}

// Auth API
export const authAPI = {
  login: (data: LoginData) => api.post<{ token: string; user: User }>('/auth/login', data),
  register: (data: RegisterData) => api.post<{ token: string; user: User }>('/auth/register', data),
  getProfile: () => api.get<User>('/auth/me'),
  updateProfile: (data: Partial<User>) => api.put<User>('/auth/profile', data),
};

// Appointments API
export const appointmentsAPI = {
  // Patient endpoints
  createAppointment: (data: Omit<AppointmentData, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => 
    api.post<AppointmentData>('/appointments', data),
  getMyAppointments: () => api.get<AppointmentData[]>('/appointments/me'),
  getUpcomingAppointments: () => api.get<AppointmentData[]>('/appointments/upcoming'),
  cancelAppointment: (id: string) => api.patch<AppointmentData>(`/appointments/${id}/cancel`),
  
  // Doctor endpoints
  getDoctorAppointments(params?: { status?: string; startDate?: string; endDate?: string }) {
    return api.get('/appointments/doctor', { params });
  },
  getDoctorAppointment: (id: string) => api.get<AppointmentData>(`/appointments/doctor/${id}`),
  updateAppointment: (id: string, data: Partial<AppointmentData>) => 
    api.patch<AppointmentData>(`/appointments/${id}`, data),
  confirmAppointment: (id: string, data: { date?: string; time?: string; notes?: string }) =>
    api.patch<AppointmentData>(`/appointments/${id}/confirm`, data),
  completeAppointment: (id: string, notes?: string) =>
    api.patch<AppointmentData>(`/appointments/${id}/complete`, { notes }),
};

// Doctor API
export const doctorAPI = {
  getStats: () => api.get<DoctorStats>('/doctors/stats'),
  getPatients: () => api.get<User[]>('/doctors/patients'),
  getPatient: (id: string) => api.get<User>(`/doctors/patients/${id}`),
  getSchedule: (startDate?: string, endDate?: string) => 
    api.get<AppointmentData[]>('/doctors/schedule', { params: { startDate, endDate } }),
  updateAvailability: (data: { days: string[]; slots: string[]; isRecurring: boolean }) =>
    api.put('/doctors/availability', data),
};

// Video API
export const videoAPI = {
  createRoom: (appointmentId: string) => 
    api.post<{ roomId: string; accessToken: string }>('/video/create-room', { appointmentId }),
  getRoom: (roomId: string) => 
    api.get<{ roomId: string; accessToken: string; appointment: AppointmentData }>(`/video/room/${roomId}`),
  endRoom: (roomId: string) => api.post(`/video/room/${roomId}/end`),
  getRoomToken: (roomId: string) => 
    api.get<{ token: string }>(`/video/room/${roomId}/token`),
};

export default api;