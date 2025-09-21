import { useEffect, useState } from "react";
import { WebContainer } from '@webcontainer/api';
import { isWebContainerSupported, getMobileMessage } from '../utils/deviceDetection';

// Global singleton instance
let globalWebContainer: WebContainer | undefined;
let isBooting = false;
let bootPromise: Promise<WebContainer> | undefined;

export function useWebContainer() {
    const [webcontainer, setWebcontainer] = useState<WebContainer | undefined>(globalWebContainer);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    async function main() {
        // Check if WebContainer is supported on this device
        if (!isWebContainerSupported()) {
            console.log('WebContainer not supported on this device');
            setError(getMobileMessage());
            return;
        }

        // If we already have a global instance, use it
        if (globalWebContainer) {
            console.log('Using existing WebContainer instance');
            setWebcontainer(globalWebContainer);
            return;
        }

        // If already booting, wait for the existing boot process
        if (isBooting && bootPromise) {
            console.log('WebContainer is already booting, waiting...');
            try {
                const instance = await bootPromise;
                setWebcontainer(instance);
                return;
            } catch (err) {
                console.error('Existing boot process failed:', err);
                // Continue with retry logic below
            }
        }

        try {
            console.log('Booting WebContainer... (attempt', retryCount + 1, ')');
            console.log('Current location:', window.location.href);
            console.log('Service Worker support:', 'serviceWorker' in navigator);
            console.log('SharedArrayBuffer support:', 'SharedArrayBuffer' in window);
            console.log('Cross-origin isolated:', window.crossOriginIsolated);

            // Check if browser supports required features
            if (!('serviceWorker' in navigator)) {
                throw new Error('ServiceWorker not supported - WebContainer requires ServiceWorker support');
            }

            if (!('SharedArrayBuffer' in window)) {
                throw new Error('SharedArrayBuffer not available - check CORS headers and ensure the page is cross-origin isolated');
            }

            if (!window.crossOriginIsolated) {
                console.warn('Page is not cross-origin isolated, this may cause issues with WebContainer');
            }

            console.log('All checks passed, attempting to boot WebContainer...');

            // Set booting flag and create boot promise
            isBooting = true;
            bootPromise = WebContainer.boot();

            const webcontainerInstance = await bootPromise;
            console.log('WebContainer booted successfully:', webcontainerInstance);

            // Store globally and update state
            globalWebContainer = webcontainerInstance;
            setWebcontainer(webcontainerInstance);
            setError(null);
            isBooting = false;
        } catch (err) {
            isBooting = false;
            bootPromise = undefined;

            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error('Failed to boot WebContainer:', err);
            console.error('Full error:', err);

            // Retry up to 3 times with exponential backoff
            if (retryCount < 3) {
                const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
                console.log(`Retrying in ${delay}ms...`);
                setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                }, delay);
            } else {
                setError(errorMessage);
            }
        }
    }

    useEffect(() => {
        main();
    }, [retryCount])

    return { webcontainer, error };
}