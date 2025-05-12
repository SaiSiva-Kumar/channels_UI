'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinChannelCard({ onClose }: { onClose: () => void }) {
  const [inputUrl, setInputUrl] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleJoin = async () => {
    if (!inputUrl.trim()) return

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : ''
    if (!token) {
      setMessage('No access token found')
      return
    }

    const url = new URL(inputUrl)
    const channelName = url.searchParams.get('channel_name')

    if (!channelName) {
      setMessage('Invalid channel URL')
      return
    }

    try {
      const response = await fetch(inputUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.is_user_exist) {
        setMessage('You already joined the channel.')
      } else if (data.creator) {
        setMessage('Creator cannot join their own channel.')
      } else if (data.is_channel_exist === false) {
        setMessage('No channel exist.')
      } else if (data.Joined) {
        const existing = localStorage.getItem('channels_data')
        if (existing) {
          const parsed = JSON.parse(existing)
          parsed.channels.push(channelName)
          parsed.total_channels += 1
          localStorage.setItem('channels_data', JSON.stringify(parsed))
        } else {
          const newData = {
            total_channels: 1,
            channels: [channelName],
          }
          localStorage.setItem('channels_data', JSON.stringify(newData))
        }
        router.push(`/chat_ui?channel_name=${encodeURIComponent(channelName)}`)
      } else {
        setMessage('Unexpected response from server.')
      }
    } catch (error) {
      setMessage('Failed to join the channel.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="relative bg-gray-900 p-6 rounded-xl w-full max-w-md space-y-4">
        <div
          className="absolute top-2 right-2 text-white text-xl cursor-pointer"
          onClick={onClose}
        >
          ×
        </div>
        <h1 className="text-2xl font-semibold text-white">Join a Channel</h1>
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="Enter channel join URL"
          className="w-full p-2 rounded-md bg-gray-800 text-white focus:outline-none"
        />
        <button
          onClick={handleJoin}
          className="w-full bg-blue-600 py-2 rounded-md hover:cursor-pointer disabled:opacity-50"
          disabled={!inputUrl.trim()}
        >
          Join
        </button>
        {message && <div className="text-gray-300 text-sm">{message}</div>}
      </div>
    </div>
  )
}
