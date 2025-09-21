import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { BuildStepsChat } from '../components/BuildStepsChat';
import { FileExplorer } from '../components/FileExplorer';
import { TabView } from '../components/TabView';
import { CodeEditor } from '../components/CodeEditor';
import { PreviewFrame } from '../components/PreviewFrame';
import { Terminal } from '../components/Terminal';
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

  useEffect(() => {
    if (webcontainer) {
      handleLog('WebContainer initialized successfully');
    }
  }, [webcontainer]);

  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'code' | 'preview' | 'chat' | 'explorer' | 'terminal'>('chat');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const handleFileSelect = (file: FileItem) => {
    setSelectedFile(file);
    setActiveTab('explorer');
  };
  
  const [steps, setSteps] = useState<Step[]>([]);

  const [files, setFiles] = useState<FileItem[]>([]);
  const [logs, setLogs] = useState<string[]>(['Terminal initialized. Ready to show build logs...']);
  const [isPreviewRunning, setIsPreviewRunning] = useState(false);

  const handleLog = (log: string) => {
    setLogs(prev => [...prev, log]);
    setIsPreviewRunning(true);
  };

  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;
    steps.filter(({status}) => status === "pending").map(step => {
      updateHappened = true;
      if (step?.type === StepType.CreateFile) {
        handleLog(`Creating file: ${step.path}`);
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
              handleLog(`✓ File created: ${currentFolder}`);
            } else {
              file.content = step.code;
              handleLog(`✓ File updated: ${currentFolder}`);
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
      } else if (step?.type === StepType.RunScript) {
        handleLog(`Running command: ${step.code}`);

        // Handle npm install commands by adding dependencies to package.json
        if (step.code.includes('npm install')) {
          // Parse the command properly - stop at && or other operators
          const commandParts = step.code.split('&&')[0].trim(); // Take only the npm install part
          const packages = commandParts.split(' ').slice(2); // Remove 'npm install'

          // Find and update package.json
          const updatePackageJson = (fileStructure: FileItem[]): boolean => {
            for (let file of fileStructure) {
              if (file.name === 'package.json' && file.type === 'file') {
                try {
                  const packageData = JSON.parse(file.content || '{}');
                  if (!packageData.dependencies) {
                    packageData.dependencies = {};
                  }

                  // Add new packages with latest version
                  packages.forEach(pkg => {
                    if (pkg && !pkg.startsWith('-') && pkg.trim() && !pkg.includes('&')) { // Skip flags, empty strings, and shell operators
                      packageData.dependencies[pkg] = 'latest';
                      handleLog(`Added ${pkg} to package.json`);
                    }
                  });

                  file.content = JSON.stringify(packageData, null, 2);
                  return true;
                } catch (error) {
                  handleLog(`Error updating package.json: ${error}`);
                  return false;
                }
              } else if (file.type === 'folder' && file.children) {
                if (updatePackageJson(file.children)) {
                  return true;
                }
              }
            }
            return false;
          };

          if (updatePackageJson(originalFiles)) {
            handleLog(`✓ Dependencies added to package.json: ${packages.join(', ')}`);
          } else {
            handleLog(`✗ Could not find package.json to update`);
          }
        } else {
          handleLog(`✓ Command queued: ${step.code}`);
        }
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
    <div className="h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col overflow-hidden relative">
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
      <header className="bg-white/95 backdrop-blur-xl border-b border-gray-200/80 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 shrink-0 relative z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-5 min-w-0 flex-1">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-all duration-200 hover:scale-105 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg sm:rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                <img src="/Clippit.webp" alt="Clippy Logo" className="w-5 h-6 sm:w-7 sm:h-9 object-contain" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gradient leading-tight">
                  clippy.ai
                </h1>
                <span className="text-xs text-gray-500 font-medium hidden sm:block">AI Code Builder</span>
              </div>
            </Link>
            <div className="hidden sm:block h-8 w-px bg-gradient-to-b from-transparent via-gray-300/60 to-transparent" />
            <div className="hidden lg:flex items-center gap-3 text-sm min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-gray-700 whitespace-nowrap">Project</span>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/60 px-4 py-2 rounded-xl max-w-[200px] xl:max-w-md">
                <span className="text-gray-800 font-mono text-xs truncate block">
                  {prompt}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Performance Warning */}
            <div className="flex md:hidden items-center gap-1 sm:gap-2 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl shadow-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span className="font-medium">Mobile performance degraded</span>
            </div>
            {webContainerError && (
              <div className="flex items-center gap-1 sm:gap-2 text-xs text-red-700 bg-red-50 border border-red-200 px-2 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl shadow-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="font-medium">Error</span>
              </div>
            )}
            <a
              href="https://github.com/polhuang/clippy-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-2 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-200 hover:scale-105 group"
            >
              <Github className="w-3 h-3 sm:w-4 sm:h-4 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline text-sm font-medium">GitHub</span>
            </a>
          </div>
        </div>
        {/* Enhanced Mobile project info */}
        <div className="sm:hidden mt-2 p-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/60 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-semibold text-gray-700 text-xs">Current Project</span>
          </div>
          <span className="text-gray-800 font-mono text-xs mt-1 block truncate">
            {prompt}
          </span>
        </div>
      </header>

      {/* Enhanced Main Content */}
      <div className="flex-1 overflow-hidden relative z-10 p-2 sm:p-4">
        {/* Desktop Layout */}
        <div className="hidden lg:block h-full">
          <ResizablePanelGroup direction="vertical" className="h-full rounded-2xl overflow-hidden bg-white/40 backdrop-blur-sm border border-white/60 shadow-xl">
            {/* Top Panel - Horizontal split for Chat, File Explorer, and Code Editor */}
            <ResizablePanel defaultSize={75} minSize={60}>
              <ResizablePanelGroup direction="horizontal" className="h-full">
                {/* Chat Panel */}
                <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
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

                <ResizableHandle withHandle className="w-1 bg-gradient-to-b from-transparent via-gray-300/60 to-transparent hover:via-blue-400/60 transition-all duration-200" />

                {/* Unified File Explorer + Code/Preview Container */}
                <ResizablePanel defaultSize={70} minSize={60}>
                  <div className="h-full p-4 pl-2 pr-4">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 shadow-lg h-full flex animate-slide-up overflow-hidden">
                      {/* File Explorer */}
                      <div className="w-[25%] min-w-[200px] max-w-[300px] border-r border-gray-200/60">
                        <div className="h-full animate-fade-in">
                          <FileExplorer
                            files={files}
                            onFileSelect={handleFileSelect}
                            selectedFile={selectedFile}
                          />
                        </div>
                      </div>

                      {/* Code Editor + Preview */}
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <TabView activeTab={activeTab} onTabChange={setActiveTab} />
                        <div className="flex-1 min-h-0 overflow-hidden">
                          <div className={`h-full ${activeTab === 'code' ? 'block' : 'hidden'}`}>
                            <CodeEditor file={selectedFile} />
                          </div>
                          <div className={`h-full ${activeTab === 'preview' ? 'block' : 'hidden'}`}>
                            <PreviewFrame webContainer={webcontainer} files={files} onLog={handleLog} loading={loading} templateSet={templateSet} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle withHandle className="h-1 bg-gradient-to-r from-transparent via-gray-300/60 to-transparent hover:via-blue-400/60 transition-all duration-200" />

            {/* Enhanced Terminal at Bottom */}
            <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
              <div className="h-full p-4 pt-2">
                <div className="h-full">
                  <Terminal logs={logs} isRunning={isPreviewRunning} />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Enhanced Mobile/Tablet Layout */}
        <div className="lg:hidden h-full flex flex-col bg-white/30 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/60 shadow-lg m-1 sm:m-2 overflow-hidden">
          {/* Mobile: Full-screen tabbed interface */}
          <div className="md:hidden h-full flex flex-col">
            {/* Mobile Tab Navigation */}
            <div className="flex border-b border-white/20 bg-gradient-to-r from-gray-50/80 to-blue-50/40">
              <button
                onClick={() => setActiveTab('chat' as any)}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'chat'
                    ? 'text-blue-700 bg-white/60 border-b-2 border-blue-500'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/30'
                }`}
              >
                💬 Chat
              </button>
              <button
                onClick={() => setActiveTab('explorer' as any)}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'explorer'
                    ? 'text-blue-700 bg-white/60 border-b-2 border-blue-500'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/30'
                }`}
              >
                📝 Code
              </button>
              <button
                onClick={() => setActiveTab('preview' as any)}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'preview'
                    ? 'text-purple-700 bg-white/60 border-b-2 border-purple-500'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/30'
                }`}
              >
                👁️ Preview
              </button>
              <button
                onClick={() => setActiveTab('terminal' as any)}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'terminal'
                    ? 'text-green-700 bg-white/60 border-b-2 border-green-500'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/30'
                }`}
              >
                💻 Terminal
              </button>
            </div>

            {/* Mobile Tab Content */}
            <div className="flex-1 overflow-hidden">
              {/* Build Chat Tab */}
              <div className={`h-full p-3 ${activeTab === 'chat' ? 'block' : 'hidden'}`}>
                <div className="h-full animate-fade-in">
                  <BuildStepsChat
                    prompt={prompt}
                    steps={steps}
                    loading={loading || !templateSet}
                    onSendMessage={handleSendMessage}
                  />
                </div>
              </div>

              {/* Code Tab (File Explorer + Code Editor) */}
              <div className={`h-full ${activeTab === 'explorer' ? 'block' : 'hidden'}`}>
                <div className="h-full flex flex-col">
                  {/* Explorer */}
                  <div className="h-1/2 border-b border-white/20">
                    <div className="h-full animate-fade-in">
                      <FileExplorer
                        files={files}
                        onFileSelect={handleFileSelect}
                        selectedFile={selectedFile}
                      />
                    </div>
                  </div>

                  {/* Code Editor */}
                  <div className="flex-1 p-2">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 shadow-lg h-full overflow-hidden">
                      <CodeEditor file={selectedFile} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Tab */}
              <div className={`h-full p-3 ${activeTab === 'preview' ? 'block' : 'hidden'}`}>
                <div className="h-full animate-fade-in">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 shadow-lg h-full overflow-hidden">
                    <PreviewFrame webContainer={webcontainer} files={files} onLog={handleLog} loading={loading} templateSet={templateSet} />
                  </div>
                </div>
              </div>

              {/* Terminal Tab */}
              <div className={`h-full p-3 ${activeTab === 'terminal' ? 'block' : 'hidden'}`}>
                <div className="h-full animate-fade-in">
                  <Terminal logs={logs} isRunning={isPreviewRunning} />
                </div>
              </div>
            </div>
          </div>

          {/* Tablet: Use resizable panels but with better mobile sizing */}
          <div className="hidden md:block lg:hidden h-full">
            <ResizablePanelGroup direction="vertical" className="h-full">
              {/* Main content area */}
              <ResizablePanel defaultSize={70} minSize={60}>
                <ResizablePanelGroup direction="horizontal" className="h-full">
                  {/* Build Chat */}
                  <ResizablePanel defaultSize={30} minSize={25} maxSize={45}>
                    <div className="h-full p-2 pr-1">
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

                  <ResizableHandle withHandle className="w-3 bg-gradient-to-b from-transparent via-gray-300 to-transparent hover:via-gray-400 transition-colors" />

                  {/* File Explorer + Code Editor/Preview */}
                  <ResizablePanel defaultSize={70} minSize={55}>
                    <div className="h-full p-2 pl-1">
                      <div className="glass-effect rounded-2xl modern-shadow h-full flex overflow-hidden animate-slide-up">
                        {/* File Explorer */}
                        <div className="w-[30%] min-w-[180px] max-w-[250px] border-r border-gray-200/60">
                          <div className="h-full animate-fade-in">
                            <FileExplorer
                              files={files}
                              onFileSelect={handleFileSelect}
                              selectedFile={selectedFile}
                            />
                          </div>
                        </div>

                        {/* Code Editor + Preview */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                          <TabView activeTab={activeTab} onTabChange={setActiveTab} />
                          <div className="flex-1 min-h-0 overflow-hidden">
                            <div className={`h-full ${activeTab === 'code' ? 'block' : 'hidden'}`}>
                              <CodeEditor file={selectedFile} />
                            </div>
                            <div className={`h-full ${activeTab === 'preview' ? 'block' : 'hidden'}`}>
                              <PreviewFrame webContainer={webcontainer} files={files} onLog={handleLog} loading={loading} templateSet={templateSet} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>

              <ResizableHandle withHandle className="h-3 bg-gradient-to-r from-transparent via-gray-300 to-transparent hover:via-gray-400 transition-colors" />

              {/* Terminal */}
              <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
                <div className="h-full p-2">
                  <Terminal logs={logs} isRunning={isPreviewRunning} />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </div>
    </div>
  );
}