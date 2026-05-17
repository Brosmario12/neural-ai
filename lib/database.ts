import { supabase } from './supabase'
import { Message, ChatSession } from './types'

export async function saveMessage(message: Message) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          id: message.id,
          session_id: message.session_id,
          role: message.role,
          content: message.content,
          timestamp: message.timestamp.toISOString(),
        },
      ])
      .select()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error saving message:', error)
    throw error
  }
}

export async function getSessionMessages(sessionId: string) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching messages:', error)
    throw error
  }
}

export async function createSession(title: string = 'New Chat'): Promise<ChatSession> {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([{ title }])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating session:', error)
    throw error
  }
}

export async function updateSessionTitle(sessionId: string, title: string) {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating session:', error)
    throw error
  }
}

export async function getSessions(): Promise<ChatSession[]> {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching sessions:', error)
    throw error
  }
}
