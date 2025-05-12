'use client'

import { useEffect, useState } from 'react'
import { useAccessToken } from '../utils/refresh_token'
import { useRouter } from 'next/navigation'
import CreateChannelPopup from './input_feild/page'
import UsersJoiningChannel from './join_channel/users_joining_card'
import Link from 'next/link'

export default function HomePage() {
  const [channels, setChannels] = useState<string[]>([])
  const [createdChannels, setCreatedChannels] = useState<string[]>([])
  const [showPopup, setShowPopup] = useState(false)
  const [showJoinCard, setShowJoinCard] = useState(false)
  const router = useRouter()

  useAccessToken()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const timestamp = localStorage.getItem('sign_in_timestamp')
    const channelsData = localStorage.getItem('channels_data')
    const createdChannelsData = localStorage.getItem('created_channels_data')

    if (!token || !timestamp || !channelsData) {
      router.push('/user_onboarding')
    } else {
      const parsedData = JSON.parse(channelsData)
      if (parsedData.channels && Array.isArray(parsedData.channels) && parsedData.channels.length > 0) {
        setChannels(parsedData.channels)
      }
      if (createdChannelsData) {
        const parsedCreated = JSON.parse(createdChannelsData)
        if (parsedCreated.channels && Array.isArray(parsedCreated.channels) && parsedCreated.channels.length > 0) {
          setCreatedChannels(parsedCreated.channels)
        }
      }
    }
  }, [router])

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-4 md:p-8 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">Created Channels</h1>
        <button
          className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm md:text-base cursor-pointer"
          onClick={() => setShowJoinCard(true)}
        >
          Join a Channel
        </button>
      </div>

      {createdChannels.length > 0 ? (
        <div className="flex flex-col space-y-4 mb-10">
          {createdChannels.map((channel, index) => (
            <Link
              key={index}
              href={`/chat_ui?channel_name=${encodeURIComponent(channel)}`}
              className="text-lg md:text-xl text-gray-300 hover:underline"
            >
              {channel}
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center mb-10">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-300">Create a Channel</h2>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">Joined Channels</h1>
      </div>

      {channels.length > 0 ? (
        <div className="flex flex-col space-y-4">
          {channels.map((channel, index) => (
            <Link
              key={index}
              href={`/chat_ui?channel_name=${encodeURIComponent(channel)}`}
              className="text-lg md:text-xl text-gray-300 hover:underline"
            >
              {channel}
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-300">Join Channels</h2>
        </div>
      )}

      <div
        className="absolute bottom-4 right-4 bg-gray-800 text-white w-12 h-12 flex items-center justify-center rounded-full cursor-pointer text-3xl"
        onClick={() => setShowPopup(true)}
      >
        +
      </div>

      {showPopup && <CreateChannelPopup onClose={() => setShowPopup(false)} />}

      {showJoinCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <UsersJoiningChannel onClose={() => setShowJoinCard(false)} />
        </div>
      )}
    </div>
  )
}
