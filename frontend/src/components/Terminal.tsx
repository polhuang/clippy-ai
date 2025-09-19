import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal as TerminalIcon } from 'lucide-react';

interface TerminalProps {
  logs: string[];
  isRunning: boolean;
}

export function Terminal({ logs, isRunning }: TerminalProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new logs are added
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [logs]);

  return (
    <Card className="h-full flex flex-col glass-effect modern-shadow">
      {/* Terminal header */}
      <div className="px-4 py-3 border-b border-white/20 bg-gradient-to-r from-gray-900/90 to-gray-800/90 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-green-400" />
          <span className="font-medium text-sm text-green-400">Terminal</span>
          {isRunning && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-400">Running</span>
            </div>
          )}
        </div>
      </div>

      {/* Terminal content */}
      <ScrollArea className="flex-1 p-4 bg-gray-900 text-green-400 font-mono text-sm" ref={scrollAreaRef}>
        <div className="space-y-1">
          {logs.length === 0 ? (
            <div className="text-gray-500 italic">
              Waiting for build logs...
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="whitespace-pre-wrap">
                {log}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}