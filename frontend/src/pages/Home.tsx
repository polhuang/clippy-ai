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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }} />
      </div>
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 px-4 sm:px-6 py-4 shrink-0 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                clippy.ai
              </h1>
            </div>
          </div>
          <a
            href="https://github.com/polhuang/clippy-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-all duration-200 hover:scale-105"
          >
            <Github className="w-5 h-5" />
          </a>
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