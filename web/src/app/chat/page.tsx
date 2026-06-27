'use client'

import { useState } from 'react'
import { UserButton } from '@clerk/nextjs'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  agent?: string
  routing_method?: string
  source_rows?: any[]
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am your Construction Project Copilot. Ask me about costs, materials, risks, or construction concepts.',
      agent: 'Orchestrator',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input }
    setMessages((prev) => [...prev, userMsg])
    const currentInput = input
    setInput('')
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput }),
      })
      const data = await response.json()
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.answer,
          agent: data.agent,
          routing_method: data.routing_method,
          source_rows: data.source_rows,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Error connecting to backend.', agent: 'System' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h1 className="text-xl font-bold">Construction Copilot</h1>
          <p className="text-xs text-muted-foreground">AI-powered construction assistant</p>
        </div>
        <UserButton />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
              {msg.agent && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold opacity-60">{msg.agent}</span>
                  {msg.routing_method && <span className="text-xs opacity-40">via {msg.routing_method}</span>}
                </div>
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.source_rows && msg.source_rows.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/30">
                  <p className="text-xs opacity-50 mb-1">Sources from dataset:</p>
                  {msg.source_rows.slice(0, 2).map((row, i) => (
                    <p key={i} className="text-xs opacity-60">
                      Project {row.project_number}: ${row.bid_total?.toLocaleString()}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-4 py-3 text-sm text-muted-foreground">Thinking...</div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t flex gap-3">
        <input
          className="flex-1 rounded-xl border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          placeholder="Ask about costs, materials, risks..."
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