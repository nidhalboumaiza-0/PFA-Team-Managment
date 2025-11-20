import { useState, useCallback } from 'react';

interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

export const useApiError = () => {
  const [error, setError] = useState<ApiError | null>(null);

  const handleError = useCallback((error: any) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      setError({
        message: error.response.data.message || 'An error occurred',
        status: error.response.status,
        details: error.response.data
      });
    } else if (error.request) {
      // The request was made but no response was received
      setError({
        message: 'No response from server. Please check your internet connection.',
        status: 0
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      setError({
        message: error.message || 'An unexpected error occurred',
        status: 0
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError
  };
}; 