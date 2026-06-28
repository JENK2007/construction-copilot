import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  agent?: string
  routing_method?: string
  source_rows?: any[]
}

export type Conversation = {
  id: string
  title: string
  messages: Message[]
  createdAt: number
}

type ChatStore = {
  conversations: Conversation[]
  activeId: string | null
  createConversation: () => string
  deleteConversation: (id: string) => void
  renameConversation: (id: string, title: string) => void
  setActive: (id: string) => void
  addMessage: (conversationId: string, message: Message) => void
  getActive: () => Conversation | null
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeId: null,

      createConversation: () => {
        const id = uuidv4()
        const newConv: Conversation = {
          id,
          title: 'New Chat',
          messages: [
            {
              id: '1',
              role: 'assistant',
              content: 'Hello! I am your Construction Project Copilot. Ask me about costs, materials, risks, or construction concepts.',
              agent: 'Orchestrator',
            },
          ],
          createdAt: Date.now(),
        }
        set((state) => ({
          conversations: [newConv, ...state.conversations],
          activeId: id,
        }))
        return id
      },

      deleteConversation: (id) => {
        set((state) => {
          const filtered = state.conversations.filter((c) => c.id !== id)
          const newActive = state.activeId === id
            ? (filtered[0]?.id ?? null)
            : state.activeId
          return { conversations: filtered, activeId: newActive }
        })
      },

      renameConversation: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title } : c
          ),
        }))
      },

      setActive: (id) => set({ activeId: id }),

      addMessage: (conversationId, message) => {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c
            const updatedMessages = [...c.messages, message]
            // Auto-title from first user message
            const title = c.title === 'New Chat' && message.role === 'user'
              ? message.content.slice(0, 40)
              : c.title
            return { ...c, messages: updatedMessages, title }
          }),
        }))
      },

      getActive: () => {
        const { conversations, activeId } = get()
        return conversations.find((c) => c.id === activeId) ?? null
      },
    }),
    { name: 'chat-storage' }
  )
)