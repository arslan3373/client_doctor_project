import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, User, Video, Clock3, CheckCircle, AlertCircle, Stethoscope, Users, DollarSign, BarChart2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { appointmentsAPI, doctorAPI } from '../services/api';
import { Appointment, DoctorStats } from '../types';

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [appointments, doctorStats] = await Promise.all([
          appointmentsAPI.getDoctorAppointments(),
          doctorAPI.getStats()
        ]);
        setUpcomingAppointments(appointments);
        setStats(doctorStats);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const getAppointmentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock3 className="mr-1 w-3 h-3" />
            Scheduled
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="mr-1 w-3 h-3" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="mr-1 w-3 h-3" />
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
        <h1 className="text-2xl font-bold text-gray-800">Welcome, Dr. {user?.name?.split(' ')[0] || ''}</h1>
        <p className="text-gray-600">Here's your practice at a glance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        {/* Today's Appointments */}
        <div className="p-6 bg-white rounded-lg border border-gray-100 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 text-blue-600 bg-blue-100 rounded-full">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today's Appointments</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '--' : stats?.todayAppointments || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Total Patients */}
        <div className="p-6 bg-white rounded-lg border border-gray-100 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 text-green-600 bg-green-100 rounded-full">
              <Users className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Patients</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '--' : stats?.totalPatients || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Monthly Earnings */}
        <div className="p-6 bg-white rounded-lg border border-gray-100 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 text-purple-600 bg-purple-100 rounded-full">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Monthly Earnings</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '--' : `$${stats?.monthlyEarnings?.toLocaleString() || '0'}`}
              </p>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="p-6 bg-white rounded-lg border border-gray-100 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 text-yellow-600 bg-yellow-100 rounded-full">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Rating</p>
              <div className="flex items-center">
                <span className="mr-2 text-2xl font-semibold text-gray-900">
                  {loading ? '--' : stats?.averageRating || '0'}
                </span>
                {!loading && stats?.averageRating && (
                  <span className="text-sm text-yellow-600">★</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-3">
        {/* Next Appointment */}
        <div className="p-6 bg-white rounded-lg border border-gray-100 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Next Appointment</h2>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-8 h-8 rounded-full border-b-2 border-blue-500 animate-spin"></div>
            </div>
          ) : upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex flex-shrink-0 justify-center items-center w-12 h-12 bg-blue-100 rounded-full">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">{upcomingAppointments[0].patientName}</h3>
                  <p className="text-sm text-gray-500">{upcomingAppointments[0].reason}</p>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                    {new Date(upcomingAppointments[0].date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <Clock className="flex-shrink-0 mr-1.5 h-4 w-4" />
                    {upcomingAppointments[0].time}
                  </div>
                  <div className="mt-2">
                    {getAppointmentStatusBadge(upcomingAppointments[0].status)}
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <Link
                  to={`/appointments/${upcomingAppointments[0].id}`}
                  className="flex flex-1 justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md border border-transparent shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  View Details
                </Link>
                {upcomingAppointments[0].type === 'video' && (
                  <Link
                    to={`/video-consultation/${upcomingAppointments[0].id}`}
                    className="flex flex-1 justify-center items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Video className="mr-2 w-4 h-4" />
                    Start Video Call
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-gray-500">No upcoming appointments</p>
              <p className="mt-1 text-sm text-gray-400">Your schedule is clear for now</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="p-6 bg-white rounded-lg border border-gray-100 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/doctor/schedule"
              className="flex items-center p-3 text-blue-700 bg-blue-50 rounded-lg transition-colors hover:bg-blue-100"
            >
              <Calendar className="mr-3 w-5 h-5" />
              <span>Manage Schedule</span>
            </Link>
            <Link
              to="/doctor/patients"
              className="flex items-center p-3 text-green-700 bg-green-50 rounded-lg transition-colors hover:bg-green-100"
            >
              <Users className="mr-3 w-5 h-5" />
              <span>View Patients</span>
            </Link>
            <Link
              to="/doctor/profile"
              className="flex items-center p-3 text-purple-700 bg-purple-50 rounded-lg transition-colors hover:bg-purple-100"
            >
              <User className="mr-3 w-5 h-5" />
              <span>Edit Profile</span>
            </Link>
            <Link
              to="/doctor/availability"
              className="flex items-center p-3 text-yellow-700 bg-yellow-50 rounded-lg transition-colors hover:bg-yellow-100"
            >
              <Clock3 className="mr-3 w-5 h-5" />
              <span>Set Availability</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="overflow-hidden bg-white rounded-lg border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Today's Appointments</h2>
          <Link
            to="/doctor/appointments"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Patient
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Time
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
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
                      <div className="w-8 h-8 rounded-full border-b-2 border-blue-500 animate-spin"></div>
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
                upcomingAppointments.slice(0, 5).map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex flex-shrink-0 justify-center items-center w-10 h-10 bg-gray-100 rounded-full">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{appointment.patientName}</div>
                          <div className="text-sm text-gray-500">{appointment.reason}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{appointment.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        appointment.type === 'in-person' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {appointment.type === 'in-person' ? 'In-Person' : 'Video'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getAppointmentStatusBadge(appointment.status)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                      <Link
                        to={`/appointments/${appointment.id}`}
                        className="mr-4 text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                      {appointment.type === 'video' && appointment.status === 'scheduled' && (
                        <Link
                          to={`/video-consultation/${appointment.id}`}
                          className="text-green-600 hover:text-green-900"
                        >
                          Start Call
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No appointments scheduled for today.
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

export default DoctorDashboard;
