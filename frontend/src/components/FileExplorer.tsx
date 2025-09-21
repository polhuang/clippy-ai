import React, { useState } from 'react';
import { FolderTree, File, ChevronRight, ChevronDown } from 'lucide-react';
import { FileItem } from '../types';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface FileExplorerProps {
  files: FileItem[];
  onFileSelect: (file: FileItem) => void;
}

interface FileNodeProps {
  item: FileItem;
  depth: number;
  onFileClick: (file: FileItem) => void;
}

function FileNode({ item, depth, onFileClick }: FileNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSelected, setIsSelected] = useState(false);

  const handleClick = () => {
    if (item.type === 'folder') {
      setIsExpanded(!isExpanded);
    } else {
      onFileClick(item);
      setIsSelected(true);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return '🟦';
      case 'js':
      case 'jsx':
        return '🟨';
      case 'css':
        return '🎨';
      case 'html':
        return '🌐';
      case 'json':
        return '📄';
      case 'md':
        return '📝';
      default:
        return '📄';
    }
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group hover-lift",
          "hover:bg-white/60 hover:shadow-sm",
          isSelected && item.type === 'file' && "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200 shadow-sm"
        )}
        style={{ paddingLeft: `${depth * 1.5 + 0.75}rem` }}
        onClick={handleClick}
      >
        {item.type === 'folder' && (
          <span className="text-gray-500 transition-transform duration-200 group-hover:text-gray-700">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        )}

        <span className="text-base">
          {item.type === 'folder' ? '📁' : getFileIcon(item.name)}
        </span>

        <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 truncate">
          {item.name}
        </span>
      </div>
      {item.type === 'folder' && isExpanded && item.children && (
        <div className="ml-2">
          {item.children.map((child, index) => (
            <FileNode
              key={`${child.path}-${index}`}
              item={child}
              depth={depth + 1}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer({ files, onFileSelect }: FileExplorerProps) {
  return (
    <div className="h-full flex flex-col bg-transparent">
      <div className="flex border-b border-gray-200/60 px-4 py-3 bg-gradient-to-r from-gray-50/80 to-blue-50/40">
        <div className="flex rounded-xl p-1 gap-1 w-full sm:w-auto">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-gray-700 h-8 px-4">
            <FolderTree className="w-4 h-4 text-green-600" />
            Explorer
          </h2>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {files.length > 0 ? (
            <div className="space-y-1">
              {files.map((file, index) => (
                <FileNode
                  key={`${file.path}-${index}`}
                  item={file}
                  depth={0}
                  onFileClick={onFileSelect}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <FolderTree className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-base font-semibold text-gray-800 mb-2">No files yet</p>
              <p className="text-sm text-gray-600 max-w-[200px] leading-relaxed">
                Files will appear here as they are generated
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}