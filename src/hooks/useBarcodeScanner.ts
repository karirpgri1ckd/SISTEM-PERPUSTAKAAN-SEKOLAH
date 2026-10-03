import { useEffect, useRef } from 'react';
import { soundService } from '../services/soundService';

interface BarcodeScannerOptions {
  onScan: (code: string) => void;
  enabled?: boolean;
  minChars?: number;
  maxDelayMs?: number;
}

/**
 * Listens for rapid keystrokes from USB barcode scanners terminating with 'Enter'
 */
export function useBarcodeScanner({
  onScan,
  enabled = true,
  minChars = 3,
  maxDelayMs = 60
}: BarcodeScannerOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea unless it is an explicit scanner field
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Allow Enter to complete barcode scan even if in input if buffer has content
      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= minChars) {
          e.preventDefault();
          const scannedCode = bufferRef.current.trim();
          bufferRef.current = '';
          soundService.playSuccessBeep();
          onScan(scannedCode);
        }
        bufferRef.current = '';
        return;
      }

      // Check if keystroke is single printable character
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (timeSinceLastKey > maxDelayMs && bufferRef.current.length > 0) {
          // If delay was too long, reset buffer (it was manual human typing)
          // But if not inside an input, we can still start buffering
          bufferRef.current = '';
        }

        // If not in standard text input, capture to buffer
        if (!isInput || target.getAttribute('data-scanner-input') === 'true') {
          bufferRef.current += e.key;
          lastKeyTimeRef.current = now;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan, enabled, minChars, maxDelayMs]);
}
