'use client'

import { useEffect } from 'react'
import { auth } from '../app/firebase_config'

const refreshAccessToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  try {
    const newAccessToken = await user.getIdToken(true); // Force refresh
    localStorage.setItem('access_token', newAccessToken);
    return newAccessToken;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return null;
  }
};

const isTokenExpired = (timestamp) => {
  const currentTime = new Date().getTime();
  const tokenAge = currentTime - parseInt(timestamp, 10);
  return tokenAge > 50 * 60 * 1000; // 50 minutes expiry check
};

const checkAndRefreshToken = async () => {
  const token = localStorage.getItem('access_token');
  const timestamp = localStorage.getItem('sign_in_timestamp');
  
  if (!token || !timestamp) {
    return null;
  }

  if (isTokenExpired(timestamp)) {
    return await refreshAccessToken(); // Refresh the token if expired
  }

  return token;
};

export const useAccessToken = () => {
  useEffect(() => {
    const fetchAndCheckToken = async () => {
      const token = await checkAndRefreshToken();
      if (token) {
        console.log('Access token is valid:', token);
      } else {
        console.log('No valid token found or token expired');
      }
    };

    fetchAndCheckToken();
  }, []);
};
