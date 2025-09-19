import { WebContainer } from '@webcontainer/api';
import React, { useEffect, useState } from 'react';

interface PreviewFrameProps {
  files: any[];
  webContainer: WebContainer | undefined;
}

export function PreviewFrame({ files, webContainer }: PreviewFrameProps) {
  // In a real implementation, this would compile and render the preview
  const [url, setUrl] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  async function main() {
    if (!webContainer) {
      console.log('WebContainer not ready yet');
      return;
    }

    if (!files || files.length === 0) {
      console.log('No files to mount yet');
      return;
    }

    if (isStarting || url) {
      console.log('Preview already starting or started');
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
        console.log('No package.json found, cannot start dev server');
        setIsStarting(false);
        return;
      }

      console.log('Starting npm install...');
      // Install dependencies
      const installProcess = await webContainer.spawn('npm', ['install']);

      installProcess.output.pipeTo(new WritableStream({
        write(data) {
          console.log('Install:', data);
        }
      }));

      // Wait for install to complete
      const installCode = await installProcess.exit;
      console.log('npm install completed with code:', installCode);

      // Set up server-ready listener before starting dev server
      webContainer.on('server-ready', (port, url) => {
        console.log('Server ready:', url, port);
        setUrl(url);
      });

      console.log('Starting dev server...');
      // Start dev server
      const devProcess = await webContainer.spawn('npm', ['run', 'dev']);

      devProcess.output.pipeTo(new WritableStream({
        write(data) {
          console.log('Dev server:', data);
        }
      }));

    } catch (error) {
      console.error('Error starting preview:', error);
      setIsStarting(false);
    }
  }

  useEffect(() => {
    main()
  }, [webContainer, files])
  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      {!url && <div className="text-center">
        <p className="mb-2">
          {!webContainer ? 'Initializing WebContainer...' :
           !files || files.length === 0 ? 'Waiting for files...' :
           isStarting ? 'Starting preview server...' :
           'Loading...'}
        </p>
      </div>}
      {url && <iframe width={"100%"} height={"100%"} src={url} />}
    </div>
  );
}