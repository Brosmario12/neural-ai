import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import type { Message } from '@/lib/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_KEY ?? 'placeholder-service-key'
)

export async function POST(request: NextRequest) {
  try {
    const { message, session_id, history } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      )
    }

    const messages = (Array.isArray(history) ? history : []).map((msg: Message) => ({
      role: msg.role,
      content: msg.content,
    }))

    messages.push({
      role: 'user',
      content: message,
    })

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: `You are Neural AI, an intelligent and helpful conversational assistant. You provide:
- Clear, concise responses
- Practical solutions to problems
- Thoughtful insights and analysis
- Friendly and professional tone
You should be direct and helpful while maintaining a conversational style.`,
      messages: messages,
    })

    const assistantMessage = response.content[0]
    if (assistantMessage.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    const responseText = assistantMessage.text

    // Save user message to Supabase
    await supabase
      .from('messages')
      .insert([
        {
          session_id,
          role: 'user',
          content: message,
          timestamp: new Date().toISOString(),
        },
      ])

    // Save assistant response to Supabase
    await supabase
      .from('messages')
      .insert([
        {
          session_id,
          role: 'assistant',
          content: responseText,
          timestamp: new Date().toISOString(),
        },
      ])

    return NextResponse.json({
      message: responseText,
      session_id,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
