import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, MapPin, Phone, Mail, FileText, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { appointmentsAPI } from '../services/api';
import toast from 'react-hot-toast';

interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorImage?: string;
  specialty?: string;
  patientName: string;
  date: string;
  time: string;
  type: 'in-person' | 'online';
  status: 'scheduled' | 'pending' | 'completed' | 'cancelled';
  consultationFee: number;
  symptoms?: string;
  location?: string;
  phone?: string;
  isVideoRequest?: boolean;
}

const MyAppointments: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await appointmentsAPI.getAll();
        
        // Mock data for demonstration - replace with actual API response
        const mockAppointments: Appointment[] = [
          {
            id: '1',
            doctorId: '1',
            doctorName: 'Dr. Sarah Johnson',
            specialty: 'Cardiologist',
            patientName: user.name,
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
            time: '10:00 AM',
            type: 'online',
            status: 'scheduled',
            consultationFee: 150,
            symptoms: 'Chest pain and shortness of breath',
            phone: user.phone || '(555) 123-4567'
          },
          {
            id: '2',
            doctorId: '2',
            doctorName: 'Dr. Michael Chen',
            specialty: 'Dermatologist',
            patientName: user.name,
            date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after tomorrow
            time: '2:30 PM',
            type: 'in-person',
            status: 'scheduled',
            consultationFee: 120,
            symptoms: 'Skin rash on arms',
            location: 'Skin Care Clinic, 456 Beauty Ave',
            phone: user.phone || '(555) 123-4567'
          },
          {
            id: '3',
            doctorId: '3',
            doctorName: 'Dr. Emily Rodriguez',
            specialty: 'Pediatrician',
            patientName: user.name,
            date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
            time: '11:00 AM',
            type: 'in-person',
            status: 'completed',
            consultationFee: 100,
            symptoms: 'Regular checkup',
            location: 'Children\'s Hospital',
            phone: user.phone || '(555) 123-4567'
          }
        ];
        
        setAppointments(mockAppointments);
      } catch (error) {
        console.error('Failed to fetch appointments:', error);
        setError('Failed to load appointments. Please try again.');
        toast.error('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user]);

  const filteredAppointments = appointments.filter(appointment => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return appointment.status === 'scheduled' || appointment.status === 'pending';
    return appointment.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleJoinVideoCall = (appointment: Appointment) => {
    if (appointment.type === 'online' && appointment.status === 'scheduled') {
      window.open(`/video-consultation/${appointment.doctorId}`, '_blank');
      toast.success('Opening video consultation...');
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await appointmentsAPI.cancel(appointmentId);
        setAppointments(prev => 
          prev.map(apt => 
            apt.id === appointmentId 
              ? { ...apt, status: 'cancelled' as const }
              : apt
          )
        );
        toast.success('Appointment cancelled successfully');
      } catch (error) {
        console.error('Failed to cancel appointment:', error);
        toast.error('Failed to cancel appointment');
      }
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Please Login</h2>
          <p className="text-gray-600">You need to be logged in to view your appointments.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your appointments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Appointments</h2>
          <p className="text-gray-600 mb-4">{error}</p>
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
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-600">Manage and track your medical appointments</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex px-6 py-4 space-x-8">
            {[
              { key: 'all', label: 'All Appointments', count: appointments.length },
              { key: 'upcoming', label: 'Upcoming', count: appointments.filter(a => a.status === 'scheduled' || a.status === 'pending').length },
              { key: 'completed', label: 'Completed', count: appointments.filter(a => a.status === 'completed').length },
              { key: 'cancelled', label: 'Cancelled', count: appointments.filter(a => a.status === 'cancelled').length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`pb-2 border-b-2 font-medium text-sm transition-colors ${
                  filter === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center bg-white border border-gray-200 rounded-lg shadow-sm">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="mb-2 text-xl font-semibold text-gray-900">No appointments found</h3>
            <p className="mb-6 text-gray-600">
              {filter === 'all' 
                ? "You haven't booked any appointments yet."
                : `No ${filter} appointments found.`
              }
            </p>
            <button
              onClick={() => window.location.href = '/doctors'}
              className="px-6 py-3 font-semibold text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Book an Appointment
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAppointments.map((appointment, index) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                        <User className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="mb-1 text-xl font-bold text-gray-900">
                          {appointment.doctorName}
                        </h3>
                        <p className="mb-2 font-semibold text-blue-600">
                          {appointment.specialty || 'General Medicine'}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(appointment.date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{appointment.time}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {appointment.type === 'online' ? (
                              <Video className="w-4 h-4" />
                            ) : (
                              <MapPin className="w-4 h-4" />
                            )}
                            <span className="capitalize">
                              {appointment.type === 'online' ? 'Video Consultation' : 'In-Person Visit'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                      <p className="mt-2 text-lg font-bold text-gray-900">
                        ${appointment.consultationFee}
                      </p>
                    </div>
                  </div>

                  {appointment.symptoms && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="mb-1 text-sm font-medium text-gray-700">Symptoms/Reason:</h4>
                      <p className="text-sm text-gray-600">{appointment.symptoms}</p>
                    </div>
                  )}

                  {appointment.location && appointment.type === 'in-person' && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="mb-1 text-sm font-medium text-gray-700">Location:</h4>
                      <p className="text-sm text-gray-600">{appointment.location}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex space-x-3">
                      {appointment.status === 'scheduled' && appointment.type === 'online' && (
                        <button
                          onClick={() => handleJoinVideoCall(appointment)}
                          className="flex items-center px-4 py-2 text-sm font-semibold text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Join Video Call
                        </button>
                      )}
                      <button className="flex items-center px-4 py-2 text-sm font-semibold text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200">
                        <Phone className="w-4 h-4 mr-2" />
                        Contact Doctor
                      </button>
                      <button className="flex items-center px-4 py-2 text-sm font-semibold text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200">
                        <FileText className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                    </div>
                    
                    {appointment.status === 'scheduled' && (
                      <div className="flex space-x-2">
                        <button className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                          Reschedule
                        </button>
                        <button 
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAppointments;