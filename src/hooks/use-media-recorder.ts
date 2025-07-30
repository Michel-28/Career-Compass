'use client';

import { useState, useRef, useCallback } from 'react';

type RecorderStatus = 'idle' | 'permission-requested' | 'recording' | 'stopped' | 'error';

// Define the chunk duration in milliseconds
const CHUNK_DURATION = 30000; // 30 seconds

export function useMediaRecorder(onChunkAvailable?: (chunk: string) => void) {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const isReady = status !== 'permission-requested' && !!stream && !error;

  const startRecording = useCallback((mediaStream: MediaStream) => {
    if (!mediaStream) {
      setError('Media stream is not available.');
      setStatus('error');
      return;
    }

    setStream(mediaStream);
    setStatus('recording');
    setIsRecording(true);
    recordedChunksRef.current = [];
    
    const mimeTypes = [
        'video/webm; codecs=vp8,opus',
        'video/webm; codecs=vp9,opus',
        'video/webm',
    ];

    const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));

    try {
        const options = supportedMimeType ? { mimeType: supportedMimeType } : undefined;
        const recorder = new MediaRecorder(mediaStream, options);
        mediaRecorderRef.current = recorder;
    } catch (e) {
      console.error('Error creating MediaRecorder.', e);
      setError('Could not create media recorder.');
      setStatus('error');
      setIsRecording(false);
      return;
    }

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
        if (onChunkAvailable) {
          const reader = new FileReader();
          reader.readAsDataURL(event.data);
          reader.onloadend = () => {
            onChunkAvailable(reader.result as string);
          };
        }
      }
    };

    // Start recording with time slicing
    mediaRecorderRef.current.start(CHUNK_DURATION);
  }, [onChunkAvailable]);

  const stopRecording = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && (status === 'recording' || isRecording)) {
        mediaRecorderRef.current.onstop = () => {
          const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
          const blob = new Blob(recordedChunksRef.current, { type: mimeType });
          
          if (blob.size === 0) {
            console.warn("Recorded blob is empty, returning null.");
            resolve(null);
            return;
          }

          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = (err) => {
              console.error("FileReader error:", err);
              resolve(null);
          }

          setStatus('stopped');
          setIsRecording(false);
        };
        // This will trigger the final ondataavailable
        mediaRecorderRef.current.stop();
      } else {
        console.warn(`stopRecording called but recorder not active. Status: ${status}, isRecording: ${isRecording}`);
        resolve(null);
      }
    });
  }, [status, isRecording]);
  
  const cleanup = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if(mediaRecorderRef.current && (isRecording || status === 'recording')) {
        try {
            // Check state to avoid errors if already stopped
            if (mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }
        } catch (e) {
            console.error("Error stopping media recorder during cleanup", e)
        }
    }
    mediaRecorderRef.current = null;
    recordedChunksRef.current = [];
    setStream(null);
    setStatus('idle');
    setIsRecording(false);
    setError(null);
  }, [stream, isRecording, status]);

  return { status, isRecording, stream, error, startRecording, stopRecording, cleanup, isReady };
}
