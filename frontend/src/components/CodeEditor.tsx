import React from 'react';
import Editor from '@monaco-editor/react';
import { FileItem } from '../types';
import { Card } from '@/components/ui/card';

interface CodeEditorProps {
  file: FileItem | null;
}

export function CodeEditor({ file }: CodeEditorProps) {
  if (!file) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground p-8 bg-blue-50/30">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-blue-100/50 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-semibold mb-2 text-foreground">No file selected</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Choose a file from the explorer to view and edit its contents
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getLanguageFromFile = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return 'plaintext';
    }
  };

  return (
    <div className="h-full flex flex-col bg-blue-50/30">
      {/* File header */}
      <div className="px-3 sm:px-6 py-3 border-b border-border/50 bg-blue-100/40 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="font-medium text-sm text-foreground truncate">{file.name}</span>
          <span className="hidden sm:inline text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
            {getLanguageFromFile(file.name)}
          </span>
        </div>
        <div className="text-xs text-muted-foreground shrink-0">
          Read-only
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 overflow-hidden">
          <Editor
            height="100%"
            language={getLanguageFromFile(file.name)}
            theme="vs-dark"
            value={file.content || ''}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              padding: { top: 20, bottom: 20, left: 16, right: 16 },
              lineNumbers: 'on',
              folding: true,
              renderWhitespace: 'selection',
              automaticLayout: true,
              bracketPairColorization: { enabled: true },
              smoothScrolling: true,
              cursorSmoothCaretAnimation: "on",
              renderLineHighlight: 'none',
              overviewRulerBorder: false,
              hideCursorInOverviewRuler: true,
              scrollbar: {
                vertical: 'auto',
                horizontal: 'auto',
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}