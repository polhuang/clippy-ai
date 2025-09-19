import { WebContainer } from '@webcontainer/api';
import React, { useEffect, useState } from 'react';

interface PreviewFrameProps {
  files: any[];
  webContainer: WebContainer | undefined;
  onLog?: (log: string) => void;
}

export function PreviewFrame({ files, webContainer, onLog }: PreviewFrameProps) {
  // In a real implementation, this would compile and render the preview
  const [url, setUrl] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  async function main() {
    if (!webContainer) {
      onLog?.('WebContainer not ready yet');
      return;
    }

    if (!files || files.length === 0) {
      onLog?.('No files to mount yet');
      return;
    }

    if (isStarting || url) {
      onLog?.('Preview already starting or started');
      return;
    }

    setIsStarting(true);

    try {
      // Check if package.json exists
      const packageJsonExists = files.some(file =>
        file.name === 'package.json' ||
        (file.children && file.children.some((child: any) => child.name === 'package.json'))
      );

      if (!packageJsonExists) {
        onLog?.('No package.json found, cannot start dev server');
        setIsStarting(false);
        return;
      }

      onLog?.('Starting npm install...');
      // Install dependencies
      const installProcess = await webContainer.spawn('npm', ['install']);

      installProcess.output.pipeTo(new WritableStream({
        write(data) {
          onLog?.(`Install: ${data}`);
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

      devProcess.output.pipeTo(new WritableStream({
        write(data) {
          onLog?.(`Dev server: ${data}`);
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
    <div className="h-full flex flex-col">
      {!url ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted/50 rounded-2xl flex items-center justify-center">
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
                 !files || files.length === 0 ? 'Waiting for files...' :
                 isStarting ? 'Starting preview server...' :
                 'Preview Loading...'}
              </p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {!webContainer ? 'Setting up the development environment' :
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
          <div className="px-6 py-3 border-b border-border/50 bg-muted/20 flex items-center justify-between">
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