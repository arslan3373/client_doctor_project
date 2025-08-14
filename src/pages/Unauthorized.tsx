import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized: React.FC = () => {
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="bg-amber-100 p-6 rounded-full mb-6">
        <ShieldAlert className="w-16 h-16 text-amber-600" />
      </div>
      <h1 className="text-4xl font-bold text-gray-800 mb-4">403 - Access Denied</h1>
      <p className="text-xl text-gray-600 mb-8 max-w-md">
        You don't have permission to access this page. Please contact an administrator if you believe this is an error.
      </p>
      <div className="flex gap-4">
        <Link 
          to={from} 
          className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Go Back
        </Link>
        <Link 
          to="/" 
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
