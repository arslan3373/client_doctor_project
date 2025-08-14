import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { User, RegisterData } from '../services/api';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isDoctor: boolean;
  isPatient: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: Omit<RegisterData, 'id'>) => Promise<User>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<User>;
  checkAuth: () => Promise<boolean>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is authenticated
  const isAuthenticated = !!user;
  const isDoctor = user?.role === 'doctor';
  const isPatient = user?.role === 'patient';

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Optionally validate token with backend
          try {
            const response = await authAPI.getProfile();
            if (response.data) {
              setUser(response.data);
              localStorage.setItem('user', JSON.stringify(response.data));
            }
          } catch (error) {
            console.warn('Token validation failed, using stored user data');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Logout function
  const logout = useCallback(() => {
    // Clear auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    
    // Redirect to home
    navigate('/');
  }, [navigate]);

  // Check authentication status
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      // If we have a user in state, consider them authenticated
      if (user) return true;
      
      // Otherwise, try to fetch the user profile
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
      
      // Store auth data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      // Show success message
      toast.success(`Welcome back, ${userData.name}!`);
      
      // Redirect based on role
      if (userData.role === 'doctor') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/patient/dashboard');
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
        
        // Log the full error for debugging
        console.error('Login error details:', {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data
        });
        
        // Use the most specific error message available
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
      
      // Store auth data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(registeredUser));
      setUser(registeredUser);
      
      // Show success message
      if (registeredUser.role === 'doctor') {
        toast.success('Doctor registration submitted! Please wait for admin approval.');
        navigate('/doctor/dashboard');
      } else {
        toast.success('Registration successful! Welcome to HealthCare+');
        navigate('/patient/dashboard');
      }
      
      return registeredUser;
    } catch (error: unknown) {
      console.error('Registration failed:', error);
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string; error?: string } } };
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
  const updateUser = useCallback(async (userData: Partial<User>): Promise<User> => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      const response = await authAPI.updateProfile(userData);
      const updatedUser = { ...user, ...response.data } as User;
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Profile updated successfully');
      return updatedUser;
    } catch (error: unknown) {
      console.error('Profile update failed:', error);
      let errorMessage = 'Failed to update profile';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }
      
      toast.error(errorMessage);
      throw error;
    }
  }, [user]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    user,
    isAuthenticated,
    isDoctor,
    isPatient,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    checkAuth,
  }), [user, isAuthenticated, isDoctor, isPatient, isLoading, login, register, logout, updateUser, checkAuth]);

  return (
    <AuthContext.Provider value={contextValue}>
      {!isLoading ? children : <LoadingSpinner />}
    </AuthContext.Provider>
  );
};