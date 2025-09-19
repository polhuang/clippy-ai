import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { Send, Loader2 } from 'lucide-react';
import { Step } from '../types';

interface BuildStepsChatProps {
  prompt: string;
  steps: Step[];
  loading: boolean;
  onSendMessage: (message: string) => void;
}

export function BuildStepsChat({ prompt, steps, loading, onSendMessage }: BuildStepsChatProps) {
  const [inputMessage, setInputMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [steps, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !loading) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const formatStepAsMessage = (step: Step) => {
    return `**${step.title}**\n\n${step.description}${step.code ? `\n\n\`\`\`\n${step.code}\n\`\`\`` : ''}`;
  };

  return (
    <Card className="flex flex-col h-full glass-effect modern-shadow">
      <div className="px-6 py-4 border-b border-white/20 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
        <h2 className="text-lg font-bold flex items-center gap-3 text-gray-800">
          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse shadow-lg" />
          Build Chat
        </h2>
      </div>

      <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
        <div className="space-y-6">
          {/* Initial user prompt */}
          <ChatMessage
            message={prompt}
            isUser={true}
          />

          {/* Build steps as assistant messages */}
          {steps.map((step) => (
            <ChatMessage
              key={step.id}
              message={formatStepAsMessage(step)}
              isUser={false}
            />
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-4 mb-6">
              <div className="w-10 h-10 mt-1 flex items-center justify-center bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl shadow-sm">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              </div>
              <Card className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 border border-blue-200/50 p-5 max-w-[85%] shadow-sm">
                <div className="text-sm text-gray-700 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="font-medium">Generating build steps...</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-6 border-t border-white/20 bg-gradient-to-r from-gray-50/50 to-blue-50/30">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask for modifications or improvements..."
            disabled={loading}
            className="flex-1 bg-white/80 backdrop-blur-sm border-white/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 rounded-xl shadow-sm"
          />
          <Button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            size="icon"
            className="shrink-0 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-lg rounded-xl"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}