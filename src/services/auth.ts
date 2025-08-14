import { getAuthToken } from '../utils/auth';

/**
 * Get the authorization header with the JWT token
 * @returns {Object} Authorization header object
 */
export const getAuthHeader = (): { Authorization: string } | {} => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Check if the current user is authenticated
 * @returns {boolean} True if authenticated, false otherwise
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

/**
 * Get the current user's role
 * @returns {string | null} The user's role or null if not authenticated
 */
export const getUserRole = (): string | null => {
  const token = getAuthToken();
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export default {
  getAuthHeader,
  isAuthenticated,
  getUserRole
};
