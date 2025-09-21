import React from 'react';
import { Code2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TabViewProps {
  activeTab: 'code' | 'preview';
  onTabChange: (tab: 'code' | 'preview') => void;
}

export function TabView({ activeTab, onTabChange }: TabViewProps) {
  return (
    <div className="flex px-4 py-3 bg-gradient-to-r from-gray-50/80 to-blue-50/40">
      <div className="flex bg-white/80 backdrop-blur-sm rounded-xl p-1 gap-1 w-full sm:w-auto shadow-md">
        <Button
          variant={activeTab === 'code' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onTabChange('code')}
          className={cn(
            "flex items-center gap-2 h-8 px-4 transition-all duration-200 flex-1 sm:flex-none rounded-lg animate-scale-in",
            activeTab === 'code'
              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:from-blue-600 hover:to-purple-700 hover:scale-105"
              : "text-gray-600 hover:text-gray-800 hover:bg-white/70 hover:shadow-sm"
          )}
        >
          <Code2 className="w-4 h-4" />
          <span className="font-semibold text-sm">Code</span>
        </Button>
        <Button
          variant={activeTab === 'preview' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onTabChange('preview')}
          className={cn(
            "flex items-center gap-2 h-8 px-4 transition-all duration-200 flex-1 sm:flex-none rounded-lg animate-scale-in",
            activeTab === 'preview'
              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:from-blue-600 hover:to-purple-700 hover:scale-105"
              : "text-gray-600 hover:text-gray-800 hover:bg-white/70 hover:shadow-sm"
          )}
        >
          <Eye className="w-4 h-4" />
          <span className="font-semibold text-sm">Preview</span>
        </Button>
      </div>
    </div>
  );
}