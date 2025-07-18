'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { jwtDecode } from 'jwt-decode'
import { checkTokenExpiration } from '../../utils/authUtil'

export default function ChatUIPage() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<
    { id?: number; type: 'sent' | 'received'; content: string; status?: string; user_id?: string; user_name?: string }[]
  >([])
  const [copied, setCopied] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [isCreator, setIsCreator] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
  const ws = useRef<WebSocket | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const [token, setToken] = useState<string | null>(() => (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null))
  const channel_name = searchParams.get('channel_name') || ''
  const lastSentMessage = useRef<string | null>(null)
  const currentUserId = token ? (jwtDecode(token) as { user_id: string }).user_id : null

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token')
    const channelsData = localStorage.getItem('channels_data')
    const createdChannelsData = localStorage.getItem('created_channels_data')
    if (!accessToken || !channelsData || !createdChannelsData) {
      router.push('/user_onboarding')
      return
    }
    setIsValidating(false)
  }, [router])

  useEffect(() => {
    setIsMobile(/Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent))
  }, [])

  useEffect(() => {
    async function verifyAndSetToken() {
      if (!token) return
      const newToken = await checkTokenExpiration(token)
      if (newToken && typeof newToken === 'string') {
        localStorage.setItem('access_token', newToken)
        setToken(newToken)
      }
    }
    verifyAndSetToken()
  }, [])

  useEffect(() => {
    if (token && channel_name && currentUserId) {
      const params = new URLSearchParams({ token, channel_name })
      const wsUrl = `wss://web-production-4a7d.up.railway.app/ws/channel/?${params.toString()}`
      ws.current = new WebSocket(wsUrl)
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (Object.prototype.hasOwnProperty.call(data, 'deleted_message_id')) {
          const deletedId = Number(data.deleted_message_id)
          setMessages(prev =>
            prev.map(msg =>
              Number(msg.id) === deletedId
                ? { ...msg, content: 'message has been deleted', user_name: undefined, status: undefined }
                : msg
            )
          )
          return
        }
        if (typeof data.creator === 'boolean') {
          setIsCreator(data.creator)
        }
        if (Array.isArray(data.previous_messages)) {
          const previous = data.previous_messages.map((msg: any) => ({
            id: Number(msg.id),
            type: msg.user_id === currentUserId ? 'sent' : 'received',
            content: msg.message,
            user_id: msg.user_id,
            user_name: msg.user_name
          }))
          setMessages(prev => [...prev, ...previous])
        } else if (data.message === 'Message delivered') {
          if (lastSentMessage.current) {
            setMessages(prev =>
              prev.map(m =>
                m.type === 'sent' && m.content === lastSentMessage.current
                  ? { ...m, status: 'Message delivered' }
                  : m
              )
            )
          }
        } else if (data.message && data.message === lastSentMessage.current && data.message_id) {
          setMessages(prev =>
            prev.map(m =>
              m.type === 'sent' && m.content === lastSentMessage.current
                ? { ...m, id: data.message_id }
                : m
            )
          )
        } else if (data.message && data.message !== lastSentMessage.current) {
          if (data.message_id && data.user_id) {
            setMessages(prev => [
              ...prev,
              {
                id: data.message_id,
                type: 'received',
                content: data.message,
                user_id: data.user_id,
                user_name: data.user_name
              }
            ])
          }
        }
      }
      ws.current.onclose = () => {
        console.log('WebSocket connection closed')
      }
      return () => {
        ws.current?.close()
      }
    }
  }, [token, channel_name, currentUserId])

  const sendMessage = () => {
    if (ws.current && message.trim() !== '') {
      const commandRegex = /^\/(time_out_user|ban_user)\s+(\S+)\s+(.+)$/i
      const match = message.trim().match(commandRegex)
      if (match) {
        const cmd = match[1].toLowerCase()
        const user_id = match[2]
        const username = match[3]
        ws.current.send(JSON.stringify({ command: cmd, user_id, username }))
        setMessage('')
        return
      }
      const messageData = JSON.stringify({ message })
      lastSentMessage.current = message
      ws.current.send(messageData)
      setMessages(prev => [...prev, { type: 'sent', content: message }])
      setMessage('')
    }
  }

  const copyLink = () => {
    const url = `https://join/${channel_name}`
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        () => setCopied(true),
        () => {
          const textarea = document.createElement('textarea')
          textarea.value = url
          textarea.setAttribute('readonly', '')
          textarea.style.position = 'absolute'
          textarea.style.left = '-9999px'
          document.body.appendChild(textarea)
          textarea.select()
          document.execCommand('copy')
          document.body.removeChild(textarea)
          setCopied(true)
        }
      )
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'absolute'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
    }
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = (id: number) => {
    if (ws.current && id) {
      ws.current.send(JSON.stringify({ command: 'soft_delete', message_id: id }))
      setActiveDropdown(null)
    }
  }

  if (isValidating) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-4 md:p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl md:text-3xl font-semibold">Channel: {channel_name}</h1>
        <div className="relative">
          <button onClick={copyLink} className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm md:text-base cursor-pointer">Share</button>
          {!isMobile && copied && (
            <div className="absolute bottom-full mb-1 right-0 text-sm text-gray-200 bg-gray-800 px-2 py-1 rounded-md">Copied</div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto mb-4 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id ?? msg.content}
            className={`relative block max-w-xs md:max-w-md rounded-md p-2 pr-8 ${
              msg.type === 'sent'
                ? 'bg-blue-600 self-end ml-auto'
                : 'bg-gray-700 self-start mr-auto'
            }`}
          >
            <div>
              {msg.user_name ? `${msg.user_name}: ` : ''}
              {msg.content}
            </div>
            {msg.type === 'sent' && msg.status && (
              <div className="text-sm text-gray-400 mt-1">{msg.status}</div>
            )}
            {isCreator && msg.content !== 'message has been deleted' && (
              <div className="absolute top-1 right-1">
                <button
                  onClick={() =>
                    setActiveDropdown(activeDropdown === msg.id ? null : msg.id)
                  }
                  className="text-white px-1"
                >
                  ⋮
                </button>
                {activeDropdown === msg.id && (
                  <div className="absolute right-0 bottom-full mb-1 bg-gray-800 text-sm rounded shadow-lg z-10">
                    <button
                      onClick={() => handleDelete(msg.id!)}
                      className="block px-4 py-2 hover:bg-gray-700 w-full text-left"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          className="flex-1 p-2 rounded-l-md bg-gray-800 text-white focus:outline-none"
        />
        <button
          onClick={sendMessage}
          disabled={message.trim() === ''}
          className="bg-blue-600 px-4 py-2 rounded-r-md disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer"
        >
          Send
        </button>
      </div>
    </div>
  )
}