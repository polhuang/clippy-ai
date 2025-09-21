import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Github } from 'lucide-react';
import axios from "axios";
import { BACKEND_URL } from '../config';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function Home() {
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();

  const randomAppIdeas = [
    "A todo list app with categories and due dates",
    "A simple weather app showing current conditions",
    "A personal expense tracker with charts",
    "A recipe finder with ingredient search",
    "A habit tracker with daily streaks",
    "A photo gallery with tagging system",
    "A book reading list with progress tracking",
    "A workout timer with custom routines",
    "A plant care reminder app",
    "A color palette generator for designers"
  ];

  const getRandomIdea = () => {
    const randomIndex = Math.floor(Math.random() * randomAppIdeas.length);
    setPrompt(randomAppIdeas[randomIndex]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate('/builder', { state: { prompt } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col relative overflow-hidden">
      {/* Colorful Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(236,72,153,0.06),transparent_50%)]" />
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366F1' fill-opacity='0.03'%3E%3Ccircle cx='40' cy='40' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }} />
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-white/30 to-transparent" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-radial from-purple-200/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-radial from-blue-200/20 to-transparent rounded-full blur-2xl" />
      </div>
      
      {/* Enhanced Header */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-gray-200/80 px-4 sm:px-6 py-3 shrink-0 relative z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">
            <div className="flex items-center gap-3 hover:opacity-80 transition-all duration-200 hover:scale-105 group">
              <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                <img src="/Clippit.webp" alt="Clippy Logo" className="w-7 h-9 object-contain" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg sm:text-xl font-bold text-gradient leading-tight">
                  clippy.ai
                </h1>
                <span className="text-xs text-gray-500 font-medium hidden sm:block">AI Code Builder</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/polhuang/clippy-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-xl transition-all duration-200 hover:scale-105 group"
            >
              <Github className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline text-sm font-medium">GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="max-w-5xl w-full text-center">
          <div className="mb-20">
            <div className="flex items-center justify-center mb-12 relative">
              <div className="flex items-center ml-32">
                <img src="/Clippit.webp" alt="Clippy.ai Logo" className="w-40 h-48 object-contain drop-shadow-2xl" />
                <img src="/pixel-speech-bubble.png" alt="Speech bubble" className="h-28 w-auto opacity-90 animate-bounce -ml-24 -mt-48" style={{imageRendering: 'pixelated', animationDuration: '3s'}} />
              </div>
            </div>

            <h1 className="text-6xl sm:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 mb-8 tracking-tight font-inter leading-tight">
              What shall we build today?
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Tell me the app you want me to build, and I'll build something that might actually work (no promises)
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div className="relative group">
                <div className="flex items-center bg-white/90 backdrop-blur-sm border-2 border-white/50 shadow-2xl focus-within:border-blue-500 focus-within:shadow-blue-500/25 transition-all duration-300 rounded-2xl p-6 hover:shadow-xl">
                  <Sparkles className="w-6 h-6 text-blue-500 mr-4 flex-shrink-0" />
                  <input
                    type="text"
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to build... (e.g., 'A todo app with dark mode')"
                    className="flex-1 bg-transparent text-xl placeholder-gray-400 text-gray-900 focus:outline-none font-medium font-inter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  {prompt.trim() && (
                    <button
                      type="submit"
                      className="ml-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={getRandomIdea}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-lg transition-all duration-200 hover:scale-105 bg-white/50 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/50 hover:shadow-lg"
              >
                <span className="text-2xl">💡</span>
                Get a random app idea
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}