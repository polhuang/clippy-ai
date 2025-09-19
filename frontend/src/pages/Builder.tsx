import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BuildStepsChat } from '../components/BuildStepsChat';
import { FileExplorer } from '../components/FileExplorer';
import { TabView } from '../components/TabView';
import { CodeEditor } from '../components/CodeEditor';
import { PreviewFrame } from '../components/PreviewFrame';
import { Step, FileItem, StepType } from '../types';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { parseXml } from '../steps';
import { useWebContainer } from '../hooks/useWebContainer';
import { FileNode } from '@webcontainer/api';
import { Loader } from '../components/Loader';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { Github } from 'lucide-react';

const MOCK_FILE_CONTENT = `// This is a sample file content
import React from 'react';

function Component() {
  return <div>Hello World</div>;
}

export default Component;`;

export function Builder() {
  const location = useLocation();
  const { prompt } = location.state as { prompt: string };
  const [userPrompt, setPrompt] = useState("");
  const [llmMessages, setLlmMessages] = useState<{role: "user" | "assistant", content: string;}[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const { webcontainer, error: webContainerError } = useWebContainer();

  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  
  const [steps, setSteps] = useState<Step[]>([]);

  const [files, setFiles] = useState<FileItem[]>([]);

  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;
    steps.filter(({status}) => status === "pending").map(step => {
      updateHappened = true;
      if (step?.type === StepType.CreateFile) {
        let parsedPath = step.path?.split("/") ?? []; // ["src", "components", "App.tsx"]
        let currentFileStructure = [...originalFiles]; // {}
        let finalAnswerRef = currentFileStructure;
  
        let currentFolder = ""
        while(parsedPath.length) {
          currentFolder =  `${currentFolder}/${parsedPath[0]}`;
          let currentFolderName = parsedPath[0];
          parsedPath = parsedPath.slice(1);
  
          if (!parsedPath.length) {
            // final file
            let file = currentFileStructure.find(x => x.path === currentFolder)
            if (!file) {
              currentFileStructure.push({
                name: currentFolderName,
                type: 'file',
                path: currentFolder,
                content: step.code
              })
            } else {
              file.content = step.code;
            }
          } else {
            /// in a folder
            let folder = currentFileStructure.find(x => x.path === currentFolder)
            if (!folder) {
              // create the folder
              currentFileStructure.push({
                name: currentFolderName,
                type: 'folder',
                path: currentFolder,
                children: []
              })
            }
  
            currentFileStructure = currentFileStructure.find(x => x.path === currentFolder)!.children!;
          }
        }
        originalFiles = finalAnswerRef;
      }

    })

    if (updateHappened) {

      setFiles(originalFiles)
      setSteps(steps => steps.map((s: Step) => {
        return {
          ...s,
          status: "completed"
        }
        
      }))
    }
    console.log(files);
  }, [steps, files]);

  useEffect(() => {
    const createMountStructure = (files: FileItem[]): Record<string, any> => {
      const mountStructure: Record<string, any> = {};
  
      const processFile = (file: FileItem, isRootFolder: boolean) => {  
        if (file.type === 'folder') {
          // For folders, create a directory entry
          mountStructure[file.name] = {
            directory: file.children ? 
              Object.fromEntries(
                file.children.map(child => [child.name, processFile(child, false)])
              ) 
              : {}
          };
        } else if (file.type === 'file') {
          if (isRootFolder) {
            mountStructure[file.name] = {
              file: {
                contents: file.content || ''
              }
            };
          } else {
            // For files, create a file entry with contents
            return {
              file: {
                contents: file.content || ''
              }
            };
          }
        }
  
        return mountStructure[file.name];
      };
  
      // Process each top-level file/folder
      files.forEach(file => processFile(file, true));
  
      return mountStructure;
    };
  
    const mountStructure = createMountStructure(files);
  
    // Mount the structure if WebContainer is available
    console.log(mountStructure);
    webcontainer?.mount(mountStructure);
  }, [files, webcontainer]);

  async function init() {
    const response = await axios.post(`${BACKEND_URL}/template`, {
      prompt: prompt.trim()
    }, {
      withCredentials: true
    });
    setTemplateSet(true);
    
    const {prompts, uiPrompts} = response.data;

    setSteps(parseXml(uiPrompts[0]).map((x: Step) => ({
      ...x,
      status: "pending"
    })));

    setLoading(true);
    const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
      messages: [...prompts, prompt].map(content => ({
        role: "user",
        content
      }))
    }, {
      withCredentials: true
    })

    setLoading(false);

    setSteps(s => {
      const newSteps = parseXml(stepsResponse.data.response, s.length + 1).map(x => ({
        ...x,
        status: "pending" as "pending"
      }));
      return [...s, ...newSteps];
    });

    setLlmMessages([...prompts, prompt].map(content => ({
      role: "user",
      content
    })));

    setLlmMessages(x => [...x, {role: "assistant", content: stepsResponse.data.response}])
  }

  useEffect(() => {
    init();
  }, [])

  const handleSendMessage = async (message: string) => {
    const newMessage = {
      role: "user" as "user",
      content: message
    };

    setLoading(true);
    try {
      const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
        messages: [...llmMessages, newMessage]
      }, {
        withCredentials: true
      });

      setLlmMessages(x => [...x, newMessage]);
      setLlmMessages(x => [...x, {
        role: "assistant",
        content: stepsResponse.data.response
      }]);

      setSteps(s => {
        const newSteps = parseXml(stepsResponse.data.response, s.length + 1).map(x => ({
          ...x,
          status: "pending" as "pending"
        }));
        return [...s, ...newSteps];
      });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }} />
      </div>
      
      {/* Modern Header */}
      <header className="glass-effect border-b border-white/20 px-4 sm:px-6 py-4 shrink-0 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gradient">
                clippy.ai
              </h1>
            </div>
            <div className="hidden sm:block h-6 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent" />
            <div className="hidden sm:flex items-center gap-3 text-sm text-gray-600 min-w-0">
              <span className="font-semibold whitespace-nowrap">Project:</span>
              <span className="text-gray-800 font-mono text-xs bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-lg max-w-[200px] lg:max-w-md truncate border border-white/40 shadow-sm">
                {prompt}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {webContainerError && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="hidden sm:inline">WebContainer Error: {webContainerError}</span>
                <span className="sm:hidden">Error</span>
              </div>
            )}
            <a
              href="https://github.com/polhuang/clippy-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-all duration-200 hover:scale-105"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
        {/* Mobile project info */}
        <div className="sm:hidden mt-3 flex items-center gap-2 text-xs text-gray-600">
          <span className="font-semibold">Project:</span>
          <span className="text-gray-800 font-mono bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-lg max-w-[250px] truncate border border-white/40 shadow-sm">
            {prompt}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative z-10">
        {/* Desktop Layout */}
        <div className="hidden lg:block h-full">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Chat Panel */}
            <ResizablePanel defaultSize={28} minSize={20} maxSize={40}>
              <div className="h-full p-4 pr-2">
                <div className="h-full animate-fade-in">
                  <BuildStepsChat
                    prompt={prompt}
                    steps={steps}
                    loading={loading || !templateSet}
                    onSendMessage={handleSendMessage}
                  />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="w-2 bg-gradient-to-b from-transparent via-gray-300 to-transparent hover:via-gray-400 transition-colors" />

            {/* File Explorer */}
            <ResizablePanel defaultSize={24} minSize={15} maxSize={35}>
              <div className="h-full p-2">
                <div className="h-full animate-fade-in">
                  <FileExplorer
                    files={files}
                    onFileSelect={setSelectedFile}
                  />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="w-2 bg-gradient-to-b from-transparent via-gray-300 to-transparent hover:via-gray-400 transition-colors" />

            {/* Code Editor + Preview */}
            <ResizablePanel defaultSize={48} minSize={35}>
              <div className="h-full p-2 pl-0">
                <div className="glass-effect rounded-2xl modern-shadow h-full flex flex-col overflow-hidden animate-slide-up">
                  <TabView activeTab={activeTab} onTabChange={setActiveTab} />
                  <div className="flex-1 min-h-0 overflow-hidden">
                    {activeTab === 'code' ? (
                      <CodeEditor file={selectedFile} />
                    ) : (
                      <PreviewFrame webContainer={webcontainer} files={files} />
                    )}
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Mobile/Tablet Layout */}
        <div className="lg:hidden h-full flex flex-col">
          {/* Top Section - Chat (collapsible) */}
          <div className="h-1/3 min-h-[200px] max-h-[400px] p-4 pb-2">
            <div className="h-full animate-fade-in">
              <BuildStepsChat
                prompt={prompt}
                steps={steps}
                loading={loading || !templateSet}
                onSendMessage={handleSendMessage}
              />
            </div>
          </div>

          {/* Bottom Section - Split between Explorer and Editor */}
          <div className="flex-1 overflow-hidden">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {/* File Explorer */}
              <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
                <div className="h-full p-2 pr-1">
                  <div className="h-full animate-fade-in">
                    <FileExplorer
                      files={files}
                      onFileSelect={setSelectedFile}
                    />
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="w-2 bg-gradient-to-b from-transparent via-gray-300 to-transparent hover:via-gray-400 transition-colors" />

              {/* Code Editor + Preview */}
              <ResizablePanel defaultSize={65} minSize={50}>
                <div className="h-full p-2 pl-1">
                  <div className="glass-effect rounded-2xl modern-shadow h-full flex flex-col overflow-hidden animate-slide-up">
                    <TabView activeTab={activeTab} onTabChange={setActiveTab} />
                    <div className="flex-1 min-h-0 overflow-hidden">
                      {activeTab === 'code' ? (
                        <CodeEditor file={selectedFile} />
                      ) : (
                        <PreviewFrame webContainer={webcontainer} files={files} />
                      )}
                    </div>
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </div>
    </div>
  );
}