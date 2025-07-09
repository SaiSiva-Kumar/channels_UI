'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '../firebase_config'
import { GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence } from 'firebase/auth'

export default function OnboardingPage() {
  const router = useRouter()

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token')
    const channelsData = localStorage.getItem('channels_data')
    const createdChannelsData = localStorage.getItem('created_channels_data')

    if (accessToken && channelsData && createdChannelsData) {
      router.push('/')
    }
  }, [router])

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await setPersistence(auth, browserLocalPersistence)
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      const token = await user.getIdToken()
      localStorage.setItem('access_token', token)

      const res = await fetch('https://web-production-4a7d.up.railway.app/users_data/joined_channels/', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('channels_data', JSON.stringify(data.joined_channels))
        localStorage.setItem('created_channels_data', JSON.stringify(data.created_channels))
        localStorage.setItem('joined_channels_last_id', data.joined_channels.last_id ? data.joined_channels.last_id.toString() : '')
        localStorage.setItem('created_channels_last_id', data.created_channels.last_id ? data.created_channels.last_id.toString() : '')
      } else {
        localStorage.setItem('channels_data', JSON.stringify([]))
        localStorage.setItem('created_channels_data', JSON.stringify([]))
        localStorage.setItem('joined_channels_last_id', '')
        localStorage.setItem('created_channels_last_id', '')
      }

      console.log(user)
      router.push('/')
    } catch (error) {
      console.error('❌ Error signing in:', error)
    }
  }

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
  )
}
