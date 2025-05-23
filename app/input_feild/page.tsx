'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { checkTokenExpiration } from '../../utils/authUtil'

export default function CreateChannelPopup({ onClose }: { onClose: () => void }) {
  const [channelName, setChannelName] = useState('')
  const [channelDescription, setChannelDescription] = useState('')
  const [timedOutReasons, setTimedOutReasons] = useState('')
  const [bannedReasons, setBannedReasons] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (channelName && channelDescription && timedOutReasons && bannedReasons) {
      setIsSubmitDisabled(false)
    } else {
      setIsSubmitDisabled(true)
    }
  }, [channelName, channelDescription, timedOutReasons, bannedReasons])

  const handleSubmit = async () => {
    if (!channelName || !channelDescription || !timedOutReasons || !bannedReasons) {
      setErrorMessage('All fields are required.')
      return
    }

    const timedOutWords = timedOutReasons.split('\n').map(r => r.trim().toLowerCase())
    const bannedWords = bannedReasons.split('\n').map(r => r.trim().toLowerCase())

    const commonWords = timedOutWords.filter(word => bannedWords.includes(word))

    if (commonWords.length > 0) {
      setErrorMessage(`These words are repeated: ${commonWords.join(', ')}`)
      return
    }

    setErrorMessage('')
    setSuccessMessage('')

    let token = localStorage.getItem('access_token')
    const newToken = await checkTokenExpiration(token || '')

    if (newToken) {
      localStorage.setItem('access_token', newToken)
      token = newToken
      console.log('Token refreshed:', token)
    }

    const payload = {
      channel_name: channelName,
      channel_description: channelDescription,
      time_out_reason: timedOutWords,
      ban_reason: bannedWords,
    }

    try {
      const response = await fetch('https://web-production-4a7d.up.railway.app/create_channels/create-channel/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const responseJson = await response.json()
      if (response.status === 201) {
        const existingData = localStorage.getItem('created_channels_data')
        let parsedChannels = []

        try {
          const parsedData = existingData ? JSON.parse(existingData) : { channels: [] }
          parsedChannels = Array.isArray(parsedData.channels) ? parsedData.channels : []
        } catch (e) {
          parsedChannels = []
        }

        const updatedChannels = [...new Set([...parsedChannels, channelName])]
        const updatedData = {
          total_channels: updatedChannels.length,
          channels: updatedChannels,
        }

        localStorage.setItem('created_channels_data', JSON.stringify(updatedData))
        setSuccessMessage('Form submitted successfully!')
        setTimeout(() => {
          onClose()
          router.push(`/chat_ui?channel_name=${encodeURIComponent(channelName)}`)
        }, 1000)
      } else {
        setErrorMessage('Failed to submit the form. Please try again later.')
      }
    } catch (error) {
      setErrorMessage('Error occurred while submitting the form.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-8 text-white text-2xl cursor-pointer"
        >
          &times;
        </button>

        <h2 className="text-2xl font-semibold text-white text-center">Create Channel</h2>

        <input
          type="text"
          placeholder="Channel Name"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
        />

        <textarea
          placeholder="Channel Description"
          value={channelDescription}
          onChange={(e) => setChannelDescription(e.target.value)}
          className="w-full h-24 resize-none p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
        />

        <textarea
          placeholder="Timed Out Reasons (each point in new line)"
          value={timedOutReasons}
          onChange={(e) => setTimedOutReasons(e.target.value)}
          className="w-full h-24 resize-none p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
        />

        <textarea
          placeholder="Banned Reasons (each point in new line)"
          value={bannedReasons}
          onChange={(e) => setBannedReasons(e.target.value)}
          className="w-full h-24 resize-none p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
        />

        {errorMessage && (
          <div className="bg-red-500 text-white text-sm p-2 rounded-lg mt-4">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-500 text-white text-sm p-2 rounded-lg mt-4">
            {successMessage}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className={`w-full py-3 ${isSubmitDisabled ? 'bg-gray-600' : 'bg-red-600 hover:bg-red-700'} text-white font-semibold rounded-xl transition-colors`}
        >
          Submit
        </button>
      </div>
    </div>
  )
}
