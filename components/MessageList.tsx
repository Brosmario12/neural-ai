'use client'

import { Message } from '@/lib/types'
import { useEffect, useRef } from 'react'
import { MessageCircle, Sparkles } from 'lucide-react'

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gradient-to-b from-slate-900 to-slate-950"
    >
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
          <Sparkles className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">Welcome to Neural AI</p>
          <p className="text-sm mt-2">Start a conversation to get intelligent assistance</p>
        </div>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-100 border border-slate-700'
              }`}
            >
              <div className="flex items-start gap-2">
                {msg.role === 'assistant' && (
                  <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          </div>
        ))
      )}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-slate-800 px-4 py-3 rounded-lg border border-slate-700">
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse-soft" />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse-soft" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse-soft" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
