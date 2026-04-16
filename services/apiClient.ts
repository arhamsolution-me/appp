import axios from 'axios';

/**
 * Base custom Axios instance centralized for the application.
 * You can easily hook in interceptors here for Auth tokens in the future.
 */
export const apiClient = axios.create({
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // We can globally log network errors here, or format them for the services
    const baseMessage = error.response?.data?.error?.message || error.message;
    console.error('[API Error]:', baseMessage);
    return Promise.reject(new Error(baseMessage));
  }
);
