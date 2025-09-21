import { WebContainer } from '@webcontainer/api';
import React, { useEffect, useState } from 'react';

interface PreviewFrameProps {
  files: any[];
  webContainer: WebContainer | undefined;
  onLog?: (log: string) => void;
  loading?: boolean;
  templateSet?: boolean;
}

export function PreviewFrame({ files, webContainer, onLog, loading = false, templateSet = false }: PreviewFrameProps) {
  // In a real implementation, this would compile and render the preview
  const [url, setUrl] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [lastPackageJson, setLastPackageJson] = useState<string>("");

  async function main() {
    if (!webContainer) {
      onLog?.('WebContainer not ready yet');
      return;
    }

    if (loading || !templateSet) {
      onLog?.('Build steps are still running, waiting to complete...');
      return;
    }

    if (!files || files.length === 0) {
      onLog?.('No files to mount yet');
      return;
    }

    // Find package.json content
    const findPackageJson = (fileList: any[]): string | null => {
      for (const file of fileList) {
        if (file.name === 'package.json' && file.type === 'file') {
          return file.content || '';
        }
        if (file.children) {
          const found = findPackageJson(file.children);
          if (found !== null) return found;
        }
      }
      return null;
    };

    const currentPackageJson = findPackageJson(files);
    if (!currentPackageJson) {
      onLog?.('No package.json found, waiting for build steps to complete');
      return;
    }

    // Check if package.json has changed (indicating new dependencies)
    const packageJsonChanged = lastPackageJson && lastPackageJson !== currentPackageJson;

    if (isStarting && !packageJsonChanged) {
      onLog?.('Preview already starting or started');
      return;
    }

    // If URL exists and package.json hasn't changed, don't restart
    if (url && !packageJsonChanged) {
      return;
    }

    setIsStarting(true);
    setLastPackageJson(currentPackageJson);

    // If package.json changed and we have a running server, restart
    if (packageJsonChanged && url) {
      onLog?.('Package.json changed, reinstalling dependencies...');
      setUrl(""); // Reset URL to trigger reinstall
    }

    try {

      onLog?.('Starting npm install...');
      // Install dependencies
      const installProcess = await webContainer.spawn('npm', ['install']);

      let lastProgressTime = 0;
      installProcess.output.pipeTo(new WritableStream({
        write(data) {
          // Remove ANSI escape codes and control characters
          const cleanData = data
            .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '') // Remove ANSI escape sequences
            .replace(/\x1b\[[0-9]*[A-Z]/g, '')     // Remove additional ANSI codes
            .replace(/[\x00-\x1f\x7f]/g, '')       // Remove control characters
            .trim();

          if (cleanData && cleanData.length > 1) {
            // Check for spinner characters or progress indicators
            if (cleanData.match(/^[|\\\/\-\+\*]$/) || cleanData.length === 1) {
              // Throttle progress messages to avoid spam
              const now = Date.now();
              if (now - lastProgressTime > 2000) { // Only show progress every 2 seconds
                onLog?.(`Install: Installing dependencies...`);
                lastProgressTime = now;
              }
            } else if (cleanData.includes('packages') || cleanData.includes('added') || cleanData.includes('changed') || cleanData.includes('audited')) {
              // Show package install summaries
              onLog?.(`Install: ${cleanData}`);
            } else if (cleanData.includes('npm WARN') || cleanData.includes('npm ERR')) {
              // Show npm warnings and errors
              onLog?.(`Install: ${cleanData}`);
            }
            // Skip other output to reduce noise
          }
        }
      }));

      // Wait for install to complete
      const installCode = await installProcess.exit;
      onLog?.(`npm install completed with code: ${installCode}`);

      // Set up server-ready listener before starting dev server
      webContainer.on('server-ready', (port, url) => {
        onLog?.(`Server ready: ${url} on port ${port}`);
        setUrl(url);
      });

      onLog?.('Starting dev server...');
      // Start dev server
      const devProcess = await webContainer.spawn('npm', ['run', 'dev']);

      let lastDevProgressTime = 0;
      devProcess.output.pipeTo(new WritableStream({
        write(data) {
          // Remove ANSI escape codes and control characters
          const cleanData = data
            .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '') // Remove ANSI escape sequences
            .replace(/\x1b\[[0-9]*[A-Z]/g, '')     // Remove additional ANSI codes
            .replace(/[\x00-\x1f\x7f]/g, '')       // Remove control characters
            .trim();

          if (cleanData && cleanData.length > 2) {
            // Filter out spinner characters and single characters
            if (cleanData.match(/^[|\\\/\-\+\*]$/) || cleanData.length === 1) {
              // Throttle progress messages
              const now = Date.now();
              if (now - lastDevProgressTime > 3000) { // Only show progress every 3 seconds
                onLog?.(`Dev server: Starting server...`);
                lastDevProgressTime = now;
              }
            } else if (cleanData.includes('VITE') || cleanData.includes('Local:') || cleanData.includes('Network:') || cleanData.includes('vite]') || cleanData.includes('ready in')) {
              // Show important Vite messages
              onLog?.(`Dev server: ${cleanData}`);
            } else if (cleanData.includes('ERROR') || cleanData.includes('WARN') || cleanData.includes('✓')) {
              // Show errors, warnings, and success messages
              onLog?.(`Dev server: ${cleanData}`);
            }
            // Skip other output to reduce noise
          }
        }
      }));

    } catch (error) {
      onLog?.(`Error starting preview: ${error}`);
      setIsStarting(false);
    }
  }

  useEffect(() => {
    main()
  }, [webContainer, files])
  return (
    <div className="h-full flex flex-col bg-green-50/30">
      {!url ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100/50 rounded-2xl flex items-center justify-center">
              {isStarting ? (
                <div className="w-6 h-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-lg font-semibold mb-2 text-foreground">
                {!webContainer ? 'Initializing WebContainer...' :
                 loading || !templateSet ? 'Build steps running...' :
                 !files || files.length === 0 ? 'Waiting for files...' :
                 isStarting ? 'Starting preview server...' :
                 'Preview Loading...'}
              </p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {!webContainer ? 'Setting up the development environment' :
                 loading || !templateSet ? 'Generating project files and structure' :
                 !files || files.length === 0 ? 'Generate some files to see a preview' :
                 isStarting ? 'Installing dependencies and starting the dev server' :
                 'Please wait while the preview loads'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          {/* Preview header */}
          <div className="px-6 py-3 border-b border-border/50 bg-green-100/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="font-medium text-sm text-foreground">Live Preview</span>
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {url}
            </div>
          </div>
          {/* Preview iframe */}
          <div className="flex-1 relative">
            <iframe
              src={url}
              className="w-full h-full border-0"
              title="Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}