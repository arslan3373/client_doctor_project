/**
 * Get the authentication token from localStorage
 * @returns {string | null} The JWT token or null if not found
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

/**
 * Save the authentication token to localStorage
 * @param {string} token - The JWT token to save
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

/**
 * Remove the authentication token from localStorage
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem('authToken');
};

export default {
  getAuthToken,
  setAuthToken,
  removeAuthToken
};
