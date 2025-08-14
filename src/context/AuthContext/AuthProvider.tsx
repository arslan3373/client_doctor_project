import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authAPI } from '../../services/api';
import { User } from '../../services/api';
import { AuthContext } from './AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is authenticated
  const isAuthenticated = !!user;
  const isDoctor = user?.role === 'doctor';
  const isPatient = user?.role === 'patient';

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    toast.success('You have been logged out');
  }, [navigate]);

  // Check authentication status
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      if (user) return true;
      
      const response = await authAPI.getProfile();
      if (response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
      return false;
    }
  }, [user, logout]);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('Attempting login with:', { email });
      const response = await authAPI.login({ email, password });
      const { user: userData, token } = response.data;
      
      if (!token || !userData) {
        throw new Error('Invalid response from server');
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      toast.success(`Welcome back, ${userData.name}!`);
      
      if (userData.role === 'doctor') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/dashboard');
      }
      
      return userData;
    } catch (error: unknown) {
      console.error('Login failed:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { 
          response?: {
            status?: number;
            statusText?: string;
            data?: { 
              error?: string;
              message?: string;
              details?: string;
            } 
          } 
        };
        
        console.error('Login error details:', {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data
        });
        
        errorMessage = axiosError.response?.data?.error || 
                      axiosError.response?.data?.message || 
                      errorMessage;
      }
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Registration function
  const register = useCallback(async (userData: Omit<RegisterData, 'id'>) => {
    setIsLoading(true);
    try {
      const response = await authAPI.register(userData);
      const { user: registeredUser, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(registeredUser));
      setUser(registeredUser);
      
      toast.success('Registration successful!');
      
      if (registeredUser.role === 'doctor') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/dashboard');
      }
      
      return registeredUser;
    } catch (error: unknown) {
      console.error('Registration failed:', error);
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { 
          response?: {
            data?: { 
              message?: string;
              error?: string;
            } 
          } 
        };
        errorMessage = axiosError.response?.data?.message || 
                      axiosError.response?.data?.error || 
                      errorMessage;
      }
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Update user profile
  const updateUser = useCallback(async (userData: Partial<User>) => {
    try {
      const response = await authAPI.updateProfile(userData);
      const updatedUser = { ...user, ...response.data };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      toast.success('Profile updated successfully');
      return updatedUser;
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
      throw error;
    }
  }, [user]);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Verify token is still valid
          await checkAuth();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [checkAuth]);

  // Context value
  const contextValue = {
    user,
    isAuthenticated,
    isDoctor,
    isPatient,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    checkAuth
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {!isLoading ? children : <LoadingSpinner />}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
