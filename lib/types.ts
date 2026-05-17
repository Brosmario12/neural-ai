export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  session_id: string
}

export interface ChatSession {
  id: string
  title: string
  created_at: Date
  updated_at: Date
}

export interface ChatResponse {
  message: Message
  status: 'success' | 'error'
}
