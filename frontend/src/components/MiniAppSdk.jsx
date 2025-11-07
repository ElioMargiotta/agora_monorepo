'use client';

import { useEffect } from 'react';

export function MiniAppSdk() {
  useEffect(() => {
    const initMiniApp = async () => {
      try {
        // Dynamically import the SDK to avoid SSR issues
        const { sdk } = await import('@farcaster/miniapp-sdk');
        
        // Wait for the app to be ready, then hide loading splash
        await sdk.actions.ready();
        console.log('MiniApp SDK ready');
      } catch (error) {
        console.log('MiniApp SDK not available or failed to load:', error);
        // Gracefully handle when not running in MiniApp context
      }
    };

    initMiniApp();
  }, []);

  // This component doesn't render anything
  return null;
}