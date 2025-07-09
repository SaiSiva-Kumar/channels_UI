'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CreateChannelPopup from './input_feild/page'
import UsersJoiningChannel from './join_channel/users_joining_card'
import Link from 'next/link'
import { checkTokenExpiration } from '../utils/authUtil'

export default function HomePage() {
  const [channels, setChannels] = useState<string[]>([])
  const [createdChannels, setCreatedChannels] = useState<string[]>([])
  const [showPopup, setShowPopup] = useState(false)
  const [showJoinCard, setShowJoinCard] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const validateAndLoadData = async () => {
      const token = localStorage.getItem('access_token')
      const channelsData = localStorage.getItem('channels_data')
      const createdChannelsData = localStorage.getItem('created_channels_data')
      const joinedLastId = localStorage.getItem('joined_channels_last_id') || ''
      const createdLastId = localStorage.getItem('created_channels_last_id') || ''

      if (!token || !channelsData || !createdChannelsData) {
        router.push('/user_onboarding')
        return
      }

      const newToken = await checkTokenExpiration(token)
      if (newToken) {
        localStorage.setItem('access_token', newToken)
      }

      const params = new URLSearchParams()
      params.set('joined_max_id', joinedLastId)
      params.set('created_max_id', createdLastId)

      const res = await fetch(`https://web-production-4a7d.up.railway.app/users_data/joined_channels/?${params.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${newToken || token}`
        }
      })

      if (res.ok) {
        const data = await res.json()
        if (data.joined_channels && data.joined_channels.channels) {
          const joinedData = {
            total_channels: data.joined_channels.total_channels,
            channels: data.joined_channels.channels
          }
          localStorage.setItem('channels_data', JSON.stringify(joinedData))
          localStorage.setItem('joined_channels_last_id', data.joined_channels.last_id ? data.joined_channels.last_id.toString() : '')
          setChannels(joinedData.channels)
        } else if (channelsData) {
          const parsedData = JSON.parse(channelsData)
          setChannels(parsedData.channels || [])
        }
        if (data.created_channels && data.created_channels.channels) {
          const createdData = {
            total_channels: data.created_channels.total_channels,
            channels: data.created_channels.channels
          }
          localStorage.setItem('created_channels_data', JSON.stringify(createdData))
          localStorage.setItem('created_channels_last_id', data.created_channels.last_id ? data.created_channels.last_id.toString() : '')
          setCreatedChannels(createdData.channels)
        } else if (createdChannelsData) {
          const parsedCreated = JSON.parse(createdChannelsData)
          setCreatedChannels(parsedCreated.channels || [])
        }
      }

      setIsValidating(false)
    }

    validateAndLoadData()
  }, [router])

  if (isValidating) {
    return null
  }

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
