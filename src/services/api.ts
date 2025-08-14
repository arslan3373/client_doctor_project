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
  type: 'in-person' | 'online';
  status: 'scheduled' | 'pending' | 'confirmed' | 'completed' | 'cancelled';
  symptoms?: string;
  reason?: string;
  notes?: string;
  phone: string;
  specialization?: string;
  isVideoRequest?: boolean;
  videoRequest?: boolean;
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
  getProfile: () => api.get<User>('/auth/profile'),
  updateProfile: (data: Partial<User>) => api.put<User>('/auth/profile', data),
};

// Appointments API
export const appointmentsAPI = {
  create: (data: AppointmentData) => api.post<AppointmentData>('/appointments', data),
  getAll: () => api.get<{ data: AppointmentData[] }>('/appointments'),
  getUpcomingAppointments: () => api.get<{ data: AppointmentData[] }>('/appointments/upcoming'),
  getDoctorAppointments: () => api.get<AppointmentData[]>('/appointments/doctor'),
  getById: (id: string) => api.get<AppointmentData>(`/appointments/${id}`),
  update: (id: string, data: Partial<AppointmentData>) => api.put<AppointmentData>(`/appointments/${id}`, data),
  cancel: (id: string) => api.patch<AppointmentData>(`/appointments/${id}/cancel`),
  confirm: (id: string, data?: { date?: string; time?: string; notes?: string }) =>
    api.patch<AppointmentData>(`/appointments/${id}/confirm`, data),
  complete: (id: string, notes?: string) =>
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
  createRoom: () => api.post<{ roomId: string }>('/video/create-room'),
  getRoom: (roomId: string) => api.get<{ roomId: string }>(`/video/room/${roomId}`),
  scheduleCall: (data: { appointmentId: string; patientId: string; scheduledTime: string; duration: number }) =>
    api.post('/video/schedule', data),
  startCall: (sessionId: string) => api.post('/video/start', { sessionId }),
  joinCall: (sessionId: string) => api.post('/video/join', { sessionId }),
  endCall: (sessionId: string) => api.post('/video/end', { sessionId }),
  getSession: (sessionId: string) => api.get(`/video/session/${sessionId}`),
};

export default api;