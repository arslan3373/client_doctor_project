import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Clock, 
  User, 
  FileText, 
  CreditCard,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Video
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { appointmentsAPI } from '../services/api';

// Define types
// Import the API types
import { AppointmentData } from '../services/api';


// Sample doctor data
const getDoctorById = (id: string) => {
  const doctors = {
    '1': {
      id: '1',
      name: 'Dr. Sarah Johnson',
      specialty: 'Cardiologist',
      image: 'https://images.pexels.com/photos/5327921/pexels-photo-5327921.jpeg?auto=compress&cs=tinysrgb&w=400',
      consultationFee: 150,
      location: 'New York Medical Center'
    },
    '2': {
      id: '2',
      name: 'Dr. Michael Chen',
      specialty: 'Dermatologist',
      image: 'https://images.pexels.com/photos/5327656/pexels-photo-5327656.jpeg?auto=compress&cs=tinysrgb&w=400',
      consultationFee: 120,
      location: 'Skin Care Clinic'
    }
  };
  return doctors[id as keyof typeof doctors] || doctors['1'];
};

// Generate available time slots
const generateTimeSlots = () => {
  const slots = [];
  const times = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'
  ];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    const availableTimes = times.filter(() => Math.random() > 0.3); // Random availability
    
    slots.push({
      date: date.toISOString().split('T')[0],
      displayDate: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      times: availableTimes
    });
  }
  
  return slots;
};

const AppointmentBooking: React.FC = () => {
  const { doctorId } = useParams();

  const navigate = useNavigate();
  const doctor = getDoctorById(doctorId || '1');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState<'in-person' | 'online'>('in-person');
  const [isVideoRequest, setIsVideoRequest] = useState(false);
  const [loading, setLoading] = useState(false);

  
  const [formData, setFormData] = useState({
    patientName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male',
    symptoms: '',
    medicalHistory: '',
    currentMedications: '',
    emergencyContact: '',
    emergencyPhone: ''
  });

  const timeSlots = generateTimeSlots();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleNextStep = () => {
    if (currentStep === 1 && (!selectedDate || !selectedTime)) {
      toast.error('Please select date and time');
      return;
    }
    if (currentStep === 2 && (!formData.patientName || !formData.email || !formData.phone)) {
      toast.error('Please fill in required fields');
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleBookAppointment = async () => {
    setLoading(true);
    try {
      // For video requests, we'll use a default date/time that will be updated by the doctor
      const appointmentBase = {
        doctorId: doctor.id,
        date: selectedDate || new Date().toISOString().split('T')[0],
        time: selectedTime || '12:00',
        symptoms: formData.symptoms,
        patientName: formData.patientName,
        phone: formData.phone,
        isVideoRequest: isVideoRequest
      };

      let apiAppointmentData: AppointmentData;
      
      if (isVideoRequest) {
        // For video requests, the status will be 'pending' and type will be 'online'
        apiAppointmentData = {
          ...appointmentBase,
          type: 'online',
          status: 'pending',
          // Add any additional fields required by the API for video requests
          videoRequest: true
        } as AppointmentData;
      } else {
        // For regular appointments
        apiAppointmentData = {
          ...appointmentBase,
          type: appointmentType as 'in-person' | 'online',
          status: 'scheduled',
          videoRequest: false
        } as AppointmentData;
      }

      await appointmentsAPI.create(apiAppointmentData);

      if (isVideoRequest) {
        toast.success('Video call request sent successfully! The doctor will review and confirm your appointment.');
      } else {
        toast.success('Appointment booked successfully!');
      }
      
      setCurrentStep(4); // Success step
    } catch (error) {
      const errorMessage = isVideoRequest 
        ? 'Failed to send video call request. Please try again.'
        : 'Failed to book appointment. Please try again.';
      toast.error(error.response?.data?.message || errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const steps = isVideoRequest 
    ? [
        { number: 1, title: 'Select Date & Time', icon: Clock },
        { number: 2, title: 'Patient Information', icon: User },
        { number: 3, title: 'Review & Submit', icon: FileText },
        { number: 4, title: 'Request Sent', icon: CheckCircle }
      ]
    : [
        { number: 1, title: 'Select Date & Time', icon: Clock },
        { number: 2, title: 'Patient Information', icon: User },
        { number: 3, title: 'Review & Payment', icon: CreditCard },
        { number: 4, title: 'Confirmation', icon: CheckCircle }
      ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <Link
            to={`/doctors/${doctorId}`}
            className="inline-flex items-center text-blue-600 transition-colors hover:text-blue-700"
          >
            <ArrowLeft className="mr-2 w-5 h-5" />
            Back to Doctor Profile
          </Link>
        </div>
      </div>

      <div className="px-4 py-8 mx-auto max-w-4xl sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.number
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {currentStep > step.number ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    Step {step.number}
                  </p>
                  <p className={`text-xs ${
                    currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 ml-4 ${
                    currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Doctor Info Card */}
        <div className="p-6 mb-8 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-4">
            <img
              src={doctor.image}
              alt={doctor.name}
              className="w-16 h-16 rounded-full border-2 border-blue-100"
            />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{doctor.name}</h2>
              <p className="font-semibold text-blue-600">{doctor.specialty}</p>
              <p className="text-sm text-gray-600">{doctor.location}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-bold text-blue-600">${doctor.consultationFee}</p>
              <p className="text-sm text-gray-600">Consultation Fee</p>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Step 1: Date & Time Selection */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6"
            >
              <h3 className="mb-6 text-lg font-semibold text-gray-900">Select Date & Time</h3>
              
              {/* Appointment Type */}
              <div className="mb-6">
                <label className="block mb-3 text-sm font-medium text-gray-700">
                  Appointment Type
                </label>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <button
                    onClick={() => {
                      setAppointmentType('in-person');
                      setIsVideoRequest(false);
                    }}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      !isVideoRequest && appointmentType === 'in-person'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">In-Person Visit</div>
                    <div className="text-sm text-gray-600">Visit the clinic</div>
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => {
                        setAppointmentType('online');
                        setIsVideoRequest(false);
                      }}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                        !isVideoRequest && appointmentType === 'online'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">Video Consultation</div>
                      <div className="text-sm text-gray-600">Schedule online meeting</div>
                    </button>
                  </div>
                  <div className="md:col-span-2">
                    <button
                      onClick={() => {
                        setAppointmentType('online');
                        setIsVideoRequest(true);
                      }}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                        isVideoRequest
                          ? 'bg-green-50 border-green-500'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="p-2 mr-3 bg-green-100 rounded-full">
                          <Video className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Request Video Call</div>
                          <div className="text-sm text-gray-600">Doctor will schedule a time for video consultation</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Date Selection */}
              <div className="mb-6">
                <label className="block mb-3 text-sm font-medium text-gray-700">
                  Select Date
                </label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.date}
                      onClick={() => setSelectedDate(slot.date)}
                      className={`p-3 border-2 rounded-lg text-center transition-colors ${
                        selectedDate === slot.date
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900">
                        {slot.displayDate}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div className="mb-6">
                  <label className="block mb-3 text-sm font-medium text-gray-700">
                    Select Time
                  </label>
                  <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6">
                    {timeSlots
                      .find(slot => slot.date === selectedDate)
                      ?.times.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`p-3 border-2 rounded-lg text-center transition-colors ${
                            selectedTime === time
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-sm font-semibold text-gray-900">
                            {time}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Patient Information */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6"
            >
              <h3 className="mb-6 text-lg font-semibold text-gray-900">Patient Information</h3>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleInputChange}
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Emergency contact name"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Symptoms / Reason for Visit
                </label>
                <textarea
                  name="symptoms"
                  value={formData.symptoms}
                  onChange={handleInputChange}
                  rows={3}
                  className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your symptoms or reason for the appointment"
                />
              </div>

              <div className="mt-6">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Current Medications
                </label>
                <textarea
                  name="currentMedications"
                  value={formData.currentMedications}
                  onChange={handleInputChange}
                  rows={2}
                  className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="List any medications you are currently taking"
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Review & Payment/Request */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6"
            >
              <h3 className="mb-6 text-lg font-semibold text-gray-900">
                {isVideoRequest ? 'Review & Submit Request' : 'Review & Payment'}
              </h3>
              
              {/* Appointment Summary */}
              <div className="p-4 mb-6 bg-gray-50 rounded-lg">
                <h4 className="mb-3 font-semibold text-gray-900">
                  {isVideoRequest ? 'Appointment Request' : 'Appointment Summary'}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Doctor:</span>
                    <span className="font-medium">{doctor.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {isVideoRequest 
                        ? 'To be scheduled by doctor'
                        : new Date(selectedDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">
                      {isVideoRequest ? 'To be scheduled by doctor' : selectedTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">
                      {isVideoRequest 
                        ? 'Video Call (Requested)' 
                        : `${appointmentType.replace('-', ' ')}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Patient:</span>
                    <span className="font-medium">{formData.patientName}</span>
                  </div>
                  {isVideoRequest && (
                    <div className="pt-2 mt-2 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <Clock className="inline mr-1 w-4 h-4" />
                        The doctor will review your request and schedule a video call at their earliest convenience.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {!isVideoRequest ? (
                <>
                  {/* Payment Summary */}
                  <div className="p-4 mb-6 rounded-lg border border-gray-200">
                    <h4 className="mb-3 font-semibold text-gray-900">Payment Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Consultation Fee</span>
                        <span>${doctor.consultationFee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform Fee</span>
                        <span>$5</span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-gray-200">
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total</span>
                          <span>${doctor.consultationFee + 5}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="mb-6">
                    <h4 className="mb-3 font-semibold text-gray-900">Payment Method</h4>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-800">Demo Mode</span>
                      </div>
                      <p className="mt-1 text-sm text-blue-700">
                        This is a demo. No actual payment will be processed.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-4 mb-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Video className="w-5 h-5 text-blue-600 mt-0.5" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">Video Call Request</h4>
                      <p className="mt-1 text-sm text-blue-700">
                        You're requesting a video call consultation. The doctor will review your request and schedule a time for the video call. You'll receive a confirmation with the meeting details once scheduled.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 4 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 text-center"
            >
              <div className="flex justify-center items-center mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-gray-900">
                {isVideoRequest ? 'Request Sent Successfully!' : 'Appointment Confirmed!'}
              </h3>
              <p className="mb-6 text-gray-600">
                {isVideoRequest 
                  ? 'Your video call request has been sent to the doctor. You will receive a confirmation with the scheduled time once the doctor reviews your request.'
                  : 'Your appointment has been successfully booked. You will receive a confirmation email shortly.'
                }
              </p>
              
              <div className="p-4 mx-auto mb-6 max-w-md text-left bg-gray-50 rounded-lg">
                <h4 className="mb-2 font-semibold text-gray-900">
                  {isVideoRequest ? 'Request Details' : 'Appointment Details'}
                </h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Doctor:</strong> {doctor.name}</p>
                  {!isVideoRequest && (
                    <>
                      <p><strong>Date:</strong> {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Not specified'}</p>
                      <p><strong>Time:</strong> {selectedTime || 'Not specified'}</p>
                    </>
                  )}
                  <p><strong>Type:</strong> {isVideoRequest ? 'Video Call' : appointmentType.replace('-', ' ')}</p>
                  {isVideoRequest && (
                    <div className="pt-3 mt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <Clock className="inline mr-1 w-4 h-4" />
                        The doctor will review your request and schedule the video call at their earliest convenience.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4 justify-center sm:flex-row">
                <button
                  onClick={() => navigate('/appointments')}
                  className="px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
                >
                  View My Appointments
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 font-semibold text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200"
                >
                  Back to Home
                </button>
              </div>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          {currentStep < 4 && (
            <div className="flex justify-between px-6 py-4 border-t border-gray-200">
              <button
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className="px-6 py-2 text-gray-700 rounded-lg border border-gray-300 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {currentStep === 3 ? (
                <button
                  onClick={handleBookAppointment}
                  disabled={loading}
                  className="flex items-center px-6 py-2 text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="mr-3 -ml-1 w-4 h-4 rounded-full border-2 border-white animate-spin border-t-transparent"></div>
                      Booking...
                    </>
                  ) : (
                    'Confirm & Pay'
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNextStep}
                  className="px-6 py-2 text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
                >
                  Next
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;