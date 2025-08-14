import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    
    try {
      await login(email, password);
      toast.success('Login successful!');
      
      // The navigation is now handled in the AuthContext's login function
    } catch (error: unknown) {
      let errorMessage = 'Login failed. Please try again.';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center p-4 min-h-screen bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="overflow-hidden w-full max-w-md bg-white rounded-lg shadow-md">
        <div className="p-8">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-800">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your HealthCare+ account</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block py-2 pr-3 pl-10 w-full placeholder-gray-400 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block py-2 pr-3 pl-10 w-full placeholder-gray-400 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>
              <div className="mt-1 text-right">
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex justify-center items-center px-4 py-2 w-full text-sm font-medium text-white bg-blue-600 rounded-md border border-transparent shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  'Signing in...'
                ) : (
                  <>
                    <LogIn className="mr-2 w-4 h-4" />
                    Sign in
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="flex absolute inset-0 items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="flex relative justify-center text-sm">
                <span className="px-2 text-gray-500 bg-white">New to HealthCare+?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/register"
                className="flex justify-center px-4 py-2 w-full text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create an account
              </Link>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Are you a doctor?{' '}
                <Link to="/register?role=doctor" className="font-medium text-blue-600 hover:text-blue-500">
                  Register as a doctor
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
