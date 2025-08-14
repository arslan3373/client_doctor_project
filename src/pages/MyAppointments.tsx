import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, MapPin, Phone, Mail, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { appointmentsAPI } from '../services/api';

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
  status: 'scheduled' | 'completed' | 'cancelled';
  consultationFee: number;
  symptoms?: string;
  location?: string;
}

const MyAppointments: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await appointmentsAPI.getAll();
        setAppointments(response.data);
      } catch (error) {
        console.error('Failed to fetch appointments:', error);
      }
    };

    if (user) {
      fetchAppointments();
    }
  }, []);

  const filteredAppointments = appointments.filter(appointment => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return appointment.status === 'scheduled';
    return appointment.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
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
              { key: 'all', label: 'All Appointments' },
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'completed', label: 'Completed' },
              { key: 'cancelled', label: 'Cancelled' }
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
                {tab.label}
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
                className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                        <span className="text-lg font-semibold text-blue-600">
                          {/* {appointment.doctorName.split(' ').map(n => n[0]).join('')} */}
                        </span>
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
                    <div className="mb-4">
                      <h4 className="mb-1 text-sm font-medium text-gray-700">Symptoms/Reason:</h4>
                      <p className="text-sm text-gray-600">{appointment.symptoms}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex space-x-3">
                      {appointment.status === 'scheduled' && appointment.type === 'online' && (
                        <button
                          onClick={() => window.location.href = `/video-consultation/${appointment.doctorId}`}
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
                        <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                          Reschedule
                        </button>
                        <button className="text-sm font-medium text-red-600 hover:text-red-700">
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