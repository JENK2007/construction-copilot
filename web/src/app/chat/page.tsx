'use client'

import { useState } from 'react'
import { UserButton } from '@clerk/nextjs'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  agent?: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am your Construction Project Copilot. Ask me about costs, materials, or upload a BOQ document.',
      agent: 'Orchestrator',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Placeholder response — real agent call comes in Phase 6
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'I am processing your request. The agent backend is not connected yet.',
          agent: 'Knowledge Agent',
        },
      ])
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h1 className="text-xl font-bold">Construction Copilot</h1>
          <p className="text-xs text-muted-foreground">AI-powered construction assistant</p>
        </div>
        <UserButton />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              {msg.agent && (
                <p className="text-xs font-semibold mb-1 opacity-60">{msg.agent}</p>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-4 py-3 text-sm text-muted-foreground">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t flex gap-3">
        <input
          className="flex-1 rounded-xl border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          placeholder="Ask about costs, materials, or construction..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
        >
          Send
        </button>
      </div>
    </div>
  )
}