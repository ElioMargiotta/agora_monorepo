import { useState, useCallback } from 'react';

// Simple toast implementation
// You can replace this with a proper toast library like sonner or react-hot-toast later

export function useToast() {
  const toast = useCallback(({ title, description, variant }) => {
    const message = description || title;
    
    if (variant === 'destructive') {
      console.error(`❌ ${title}: ${description}`);
      alert(`Error: ${message}`);
    } else {
      console.log(`✅ ${title}: ${description}`);
      // For non-destructive toasts, you could show a more subtle notification
      // For now, we'll just log to console and show alerts for errors only
    }
  }, []);

  return { toast };
}
