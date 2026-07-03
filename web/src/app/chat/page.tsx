'use client'

import { useState, useRef, useEffect } from 'react'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { useChatStore } from '@/store/chatStore'

const SUGGESTIONS = [
  'How much does concrete foundation cost?',
  'What materials are best for roofing?',
  'What are risks in road construction?',
  'Explain post-tension concrete',
]

export default function ChatPage() {
  const {
    conversations, activeId, createConversation,
    deleteConversation, renameConversation,
    setActive, addMessage, getActive,
  } = useChatStore()

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Create first conversation if none exist
  useEffect(() => {
    if (conversations.length === 0) createConversation()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeId, conversations])

  const active = getActive()
  const messages = active?.messages ?? []

  const sendMessage = async (text?: string) => {
    const msg = text || input
    if (!msg.trim() || loading) return

    let convId = activeId
    if (!convId) {
      convId = createConversation()
    }

    addMessage(convId, { id: Date.now().toString(), role: 'user', content: msg })
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      const data = await response.json()
      addMessage(convId, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        agent: data.agent,
        routing_method: data.routing_method,
        source_rows: data.source_rows,
      })
    } catch {
      addMessage(convId, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error connecting to backend. Make sure the API server is running on port 8001.',
        agent: 'System',
      })
    } finally {
      setLoading(false)
    }
  }

  const startRename = (id: string, currentTitle: string) => {
    setEditingId(id)
    setEditTitle(currentTitle)
  }

  const saveRename = (id: string) => {
    if (editTitle.trim()) renameConversation(id, editTitle.trim())
    setEditingId(null)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-100">
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-sm">Construction Copilot</span>
        </div>

        {/* New Chat button */}
        <div className="px-3 py-3">
          <button onClick={() => createConversation()}
            className="w-full flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Chat history */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <p className="text-xs text-gray-400 font-medium px-2 mb-2">Recent Chats</p>
          {conversations.map((conv) => (
            <div key={conv.id}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer mb-1 ${conv.id === activeId ? 'bg-orange-50 text-orange-600' : 'hover:bg-gray-100 text-gray-700'
                }`}
              onClick={() => setActive(conv.id)}>
              <svg className="w-3 h-3 flex-shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>

              {editingId === conv.id ? (
                <input
                  className="flex-1 text-xs bg-white border border-orange-300 rounded px-1 py-0.5 outline-none"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => saveRename(conv.id)}
                  onKeyDown={(e) => e.key === 'Enter' && saveRename(conv.id)}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1 text-xs truncate">{conv.title}</span>
              )}

              <div className="hidden group-hover:flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); startRename(conv.id, conv.title) }}
                  className="p-1 hover:text-orange-500 transition">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
                  className="p-1 hover:text-red-500 transition">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Nav links */}
        <div className="border-t border-gray-100 px-3 py-3 space-y-1">
          {[
            { label: '🏠 Dashboard', href: '/dashboard' },
            { label: '💰 Cost Estimation', href: '/cost-estimation' },
            { label: '📄 PDF Analysis', href: '/pdf-analysis' },
            { label: '🤖 Agent Monitor', href: '/agents' },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center px-3 py-2 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition">
              {item.label}
            </Link>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-gray-900">
              {active?.title || 'Construction Assistant'}
            </h1>
            <p className="text-xs text-gray-500">Powered by 5 AI agents • 107K real data points</p>
          </div>
          <UserButton />
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
          {messages.length <= 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="text-left p-3 sm:p-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition">
                  {s}
                </button>
              ))}
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.agent && msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs font-semibold text-orange-500">{msg.agent}</span>
                    {msg.routing_method && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        via {msg.routing_method}
                      </span>
                    )}
                  </div>
                )}
                <div className={`rounded-2xl px-4 py-3 text-sm sm:text-base leading-relaxed ${msg.role === 'user'
                    ? 'bg-orange-500 text-white rounded-tr-sm'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                  }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.source_rows && msg.source_rows.length > 0 && (
                  <div className="bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 w-full">
                    <p className="text-xs font-medium text-orange-600 mb-1">📊 Dataset Sources</p>
                    {msg.source_rows.slice(0, 3).map((row, i) => (
                      <p key={i} className="text-xs text-gray-600">
                        • Project {row.project_number}: ${row.bid_total?.toLocaleString()}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center">
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <input
              className="flex-1 rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm sm:text-base outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
              placeholder="Ask about construction costs, materials, risks..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
              className="px-4 sm:px-6 py-3 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}