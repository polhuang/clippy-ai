import React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
}

export function ChatMessage({ message, isUser, timestamp }: ChatMessageProps) {
  return (
    <div className={`flex gap-4 mb-6 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      {!isUser && (
        <Avatar className="w-10 h-10 mt-1 shrink-0 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-500 shadow-lg">
          <AvatarFallback className="bg-transparent text-white">
            <Bot className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
      )}

      <Card className={`max-w-[85%] p-5 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl ${
        isUser
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white ml-auto border-0'
          : 'bg-white/90 backdrop-blur-sm border border-white/50 text-gray-800'
      }`}>
        <div className="text-sm leading-relaxed prose prose-sm max-w-none">
          <ReactMarkdown>{message}</ReactMarkdown>
        </div>
        {timestamp && (
          <div className={`text-xs mt-3 ${
            isUser ? 'text-white/70' : 'text-gray-500'
          }`}>
            {timestamp}
          </div>
        )}
      </Card>

      {isUser && (
        <Avatar className="w-10 h-10 mt-1 shrink-0 bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg">
          <AvatarFallback className="bg-transparent text-white">
            <User className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}