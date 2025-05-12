'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '../firebase_config'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

export default function OnboardingPage() {
  const router = useRouter()

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    const signInTimestamp = localStorage.getItem('sign_in_timestamp');
    const channelsData = localStorage.getItem('channels_data');
    const createdChannelsData = localStorage.getItem('created_channels_data');
    
    if (accessToken && signInTimestamp && channelsData && createdChannelsData) {
      router.push('/')  
    }
  }, [router]);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const token = await user.getIdToken();
      const timestamp = new Date().getTime();

      localStorage.setItem('access_token', token);
      localStorage.setItem('sign_in_timestamp', timestamp.toString());

      const response = await fetch('https://web-production-4a7d.up.railway.app/users_data/joined_channels/', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('channels_data', JSON.stringify(data.joined_channels));
        localStorage.setItem('created_channels_data', JSON.stringify(data.created_channels));
      } else {
        localStorage.setItem('channels_data', JSON.stringify([]));
        localStorage.setItem('created_channels_data', JSON.stringify([]));
      }

      console.log('✅ User signed in:', user);
      router.push('/')
    } catch (error) {
      console.error('❌ Error signing in:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-3xl md:text-4xl font-semibold">
          Step into a world where every conversation is centered around a topic you love.
        </h1>
        <p className="text-lg md:text-xl text-gray-300">
          Whether it’s gaming, tech, or something else, our channels bring together people who share your passion.
        </p>
        <p className="text-lg md:text-xl text-gray-300">
          And the best part? Our AI-powered LLM moderator ensures every chat stays on track—keeping things respectful, fun, and engaging for everyone.
        </p>
        <p className="text-lg md:text-xl text-gray-300">
          Join a channel, dive into the conversation, and let the LLM handle the rest!
        </p>
        <button
          onClick={handleGoogleSignIn}
          className="mt-6 bg-red-600 hover:bg-red-700 transition-colors text-white font-semibold py-3 px-6 rounded-xl w-full sm:w-auto sm:w-auto cursor-pointer"
        >
          Sign in / Sign up with Google
        </button>
      </div>
    </div>
  );
}

const checkTokenExpiry = () => {
  const token = localStorage.getItem('access_token');
  const timestamp = localStorage.getItem('sign_in_timestamp');
  
  if (!token || !timestamp) {
    return false;
  }

  const currentTime = new Date().getTime();
  const tokenAge = currentTime - parseInt(timestamp, 10);

  if (tokenAge > 3 * 24 * 60 * 60 * 1000) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('sign_in_timestamp');
    localStorage.removeItem('channels_data');
    localStorage.removeItem('created_channels_data');
    return false;
  }

  return true;
};

const fetchData = async () => {
  if (checkTokenExpiry()) {
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch('https://web-production-4a7d.up.railway.app/users_data/joined_channels/', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      localStorage.setItem('channels_data', JSON.stringify(data.joined_channels));
      localStorage.setItem('created_channels_data', JSON.stringify(data.created_channels));
    } catch (error) {
      console.error('❌ API request failed:', error);
    }
  }
};
