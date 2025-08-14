import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Stethoscope, Video, Clock3, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { appointmentsAPI } from '../services/api';
import { Appointment } from '../types';

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const { data: appointments } = await appointmentsAPI.getUpcomingAppointments();
        setUpcomingAppointments(appointments);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const getAppointmentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock3 className="w-3 h-3 mr-1" />
            Scheduled
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user?.name?.split(' ')[0] || 'Patient'}</h1>
        <p className="text-gray-600">Here's what's happening with your health care</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/doctors"
              className="flex items-center p-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <Stethoscope className="w-5 h-5 mr-3" />
              <span>Find a Doctor</span>
            </Link>
            <Link
              to="/appointments"
              className="flex items-center p-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
            >
              <Calendar className="w-5 h-5 mr-3" />
              <span>View All Appointments</span>
            </Link>
          </div>
        </div>

        {/* Next Appointment */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Next Appointment</h2>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">Dr. {upcomingAppointments[0].doctorName}</h3>
                  <p className="text-sm text-gray-500">{upcomingAppointments[0].specialization}</p>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                    {new Date(upcomingAppointments[0].date).toLocaleDateString()}
                  </div>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <Clock className="flex-shrink-0 mr-1.5 h-4 w-4" />
                    {upcomingAppointments[0].time}
                  </div>
                  <div className="mt-2">
                    {getAppointmentStatusBadge(upcomingAppointments[0].status)}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  to={`/video-consultation/${upcomingAppointments[0].id}`}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={upcomingAppointments[0].status !== 'scheduled'}
                >
                  <Video className="w-4 h-4 mr-2" />
                  {upcomingAppointments[0].type === 'video' ? 'Join Video Call' : 'View Details'}
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">No upcoming appointments</p>
              <Link
                to="/doctors"
                className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Stethoscope className="w-4 h-4 mr-2" />
                Book an Appointment
              </Link>
            </div>
          )}
        </div>

        {/* Health Tips */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Health Tips</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-semibold">1</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-700">Stay hydrated by drinking at least 8 glasses of water daily.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-semibold">2</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-700">Aim for 7-9 hours of quality sleep each night.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-semibold">3</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-700">Take short breaks if you sit for long periods.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Recent Appointments</h2>
          <Link
            to="/appointments"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : upcomingAppointments.length > 0 ? (
                upcomingAppointments.slice(0, 3).map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Stethoscope className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">Dr. {appointment.doctorName}</div>
                          <div className="text-sm text-gray-500">{appointment.specialization}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(appointment.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">{appointment.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        appointment.type === 'in-person' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {appointment.type === 'in-person' ? 'In-Person' : 'Video Consultation'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getAppointmentStatusBadge(appointment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/appointments/${appointment.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No appointments found. Book your first appointment!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
